import firebase_admin
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError
from flask import request, jsonify
from functools import wraps
from config.settings import Config
import logging

logger = logging.getLogger(__name__)

def verify_firebase_token(id_token: str) -> dict:
    try:
        verified_claims = auth.verify_id_token(
            id_token,
            check_revoked=True,
            clock_tolerance=30  
        )
        
        if verified_claims.get('auth_time') < (Config.JWT_EXPIRATION - 300):
            raise ValueError("Token issued too long ago")
            
        if not verified_claims.get('email_verified', False):
            raise ValueError("Email not verified")
            
        return verified_claims
    except (ValueError, FirebaseError) as e:
        logger.warning(f"Token verification failed: {str(e)}")
        raise

def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing authorization token"}), 401
            
        id_token = auth_header.split('Bearer ')[1]
        
        try:
            user_claims = verify_firebase_token(id_token)
            request.user = user_claims
        except Exception as e:
            return jsonify({"error": "Unauthorized", "message": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def get_user_public_key(uid: str) -> str:
    db = firestore.client()
    doc_ref = db.collection('users').document(uid)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise ValueError("User document not found")
        
    return doc.to_dict().get('public_key', '')