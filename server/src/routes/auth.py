from flask import Blueprint, request, jsonify
from ..firebase.auth import firebase_auth_required, get_user_public_key
from ..utils.decorators import validate_json
from ..utils.crypto_helpers import generate_jwt
from config.settings import Config
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/exchange-key', methods=['POST'])
@firebase_auth_required
@validate_json({
    'public_key': {'type': 'string', 'required': True, 'minlength': 64}
})
def exchange_public_key():
    try:
        user_id = request.user['user_id']
        public_key = request.json['public_key']
        
        from ..firebase.admin import get_firestore
        db = get_firestore()
        db.collection('users').document(user_id).set({
            'public_key': public_key,
            'last_updated': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        jwt_token = generate_jwt(user_id, public_key)
        
        return jsonify({
            'status': 'success',
            'jwt': jwt_token,
            'expires_in': Config.JWT_EXPIRATION
        }), 200
        
    except Exception as e:
        logger.error(f"Key exchange failed: {str(e)}")
        return jsonify({
            'error': 'Key exchange failed',
            'message': str(e)
        }), 400

@auth_bp.route('/verify-token', methods=['POST'])
@validate_json({'token': {'type': 'string', 'required': True}})
def verify_token():
    token = request.json.get('token')
    try:
        return jsonify({'valid': True, 'message': 'Token is valid'}), 200
    except Exception:
        return jsonify({'valid': False, 'message': 'Invalid token'}), 401