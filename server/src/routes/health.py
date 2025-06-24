from flask import Blueprint, jsonify
import redis
import time
from config.settings import Config

health_bp = Blueprint('health', __name__)

@health_bp.route('/live', methods=['GET'])
def liveness_check():
    return jsonify({'status': 'alive'}), 200

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    checks = {
        'redis': False,
        'firestore': False
    }
    
    try:
        r = redis.Redis.from_url(Config.REDIS_URL)
        r.ping()
        checks['redis'] = True
    except Exception:
        pass
        
    try:
        from ..firebase.admin import get_firestore
        db = get_firestore()
        db.collection('health').document('check').set({'timestamp': time.time()})
        checks['firestore'] = True
    except Exception:
        pass
        
    status = 200 if all(checks.values()) else 503
    return jsonify({
        'status': 'ready' if status == 200 else 'degraded',
        'checks': checks
    }), status