from functools import wraps
from flask import request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from .validators import validate_request_data
from config.settings import Config

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address, storage_uri=Config.RATELIMIT_STORAGE_URI)

def validate_json(schema: dict):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Unsupported Media Type"}), 415
            errors = validate_request_data(request.json, schema)
            if errors:
                logger.warning(f"Validation failed: {errors}")
                return jsonify({"error": "Invalid request", "details": errors}), 400
                
            return f(*args, **kwargs)
        return wrapper
    return decorator

def rate_limit(limit: str):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if Config.FLASK_ENV == 'testing':
                return f(*args, **kwargs)
            return limiter.limit(limit)(f)(*args, **kwargs)
        return wrapper
    return decorator

def audit_action(action: str):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            response = f(*args, **kwargs)
            user = getattr(request, 'user', None)
            user_id = user['user_id'] if user else 'anonymous'
            logger.info(f"AUDIT: {user_id} performed {action} - Status {response[1]}")
            
            return response
        return wrapper
    return decorator