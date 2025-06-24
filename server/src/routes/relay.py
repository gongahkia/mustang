from flask import Blueprint, request, jsonify
from ..chain.persistence import MessageStore
from ..chain.verifier import ChainVerifier
from ..firebase.auth import firebase_auth_required, get_user_public_key
from ..utils.decorators import validate_json, rate_limit
from ..models import ChainLink
from config.settings import Config
import logging
import datetime

relay_bp = Blueprint('relay', __name__)
logger = logging.getLogger(__name__)

store = MessageStore(Config.REDIS_URL, Config.MESSAGE_TTL)
verifier = ChainVerifier(store)

@relay_bp.route('/send', methods=['POST'])
@firebase_auth_required
@rate_limit("10 per minute")
@validate_json({
    'recipient_id': {'type': 'string', 'required': True},
    'ciphertext': {'type': 'string', 'required': True, 'encoding': 'base64'},
    'iv': {'type': 'string', 'required': True, 'minlength': 16, 'maxlength': 16, 'encoding': 'base64'},
    'chain_hash': {'type': 'string', 'required': True, 'minlength': 64, 'maxlength': 64},
    'previous_hash': {'type': 'string', 'required': True, 'minlength': 64, 'maxlength': 64}
})
def send_message():
    try:
        sender_id = request.user['user_id']
        data = request.json
        
        chain_link = ChainLink(
            message_id=f"{sender_id}-{datetime.datetime.utcnow().isoformat()}",
            previous_hash=data['previous_hash'],
            current_hash=data['chain_hash'],
            ciphertext=data['ciphertext'].encode('latin1'),
            iv=data['iv'].encode('latin1'),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(seconds=Config.MESSAGE_TTL)
        )
        
        if not verifier.verify_and_store(chain_link):
            return jsonify({
                'error': 'Chain verification failed',
                'message': 'Invalid hash chain'
            }), 400
            
        recipient_key = get_user_public_key(data['recipient_id'])
        
        return jsonify({
            'status': 'success',
            'message_id': chain_link.message_id,
            'ttl': Config.MESSAGE_TTL,
            'recipient_key_found': bool(recipient_key)
        }), 201
        
    except Exception as e:
        logger.error(f"Message relay failed: {str(e)}")
        return jsonify({
            'error': 'Message relay failed',
            'message': str(e)
        }), 500

@relay_bp.route('/receive/<message_id>', methods=['GET'])
@firebase_auth_required
@rate_limit("30 per minute")
def receive_message(message_id):
    try:
        message = store.retrieve_message(message_id)
        if not message:
            return jsonify({
                'error': 'Not found',
                'message': 'Message expired or does not exist'
            }), 404
            
        recipient_id = request.user['user_id']
        if not message_id.startswith(recipient_id) and not message_id.endswith(recipient_id):
            return jsonify({
                'error': 'Forbidden',
                'message': 'You are not the recipient'
            }), 403
            
        return jsonify({
            'ciphertext': message.ciphertext.decode('latin1'),
            'iv': message.iv.decode('latin1'),
            'chain_hash': message.current_hash,
            'previous_hash': message.previous_hash,
            'expires_in': store.get_remaining_ttl(message_id)
        }), 200
        
    except Exception as e:
        logger.error(f"Message retrieval failed: {str(e)}")
        return jsonify({
            'error': 'Retrieval failed',
            'message': str(e)
        }), 500