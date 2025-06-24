import firebase_admin
from firebase_admin import credentials, firestore
from config.settings import Config
import logging
import os

logger = logging.getLogger(__name__)

def init_firebase():
    if firebase_admin._apps:
        return  
    cred_path = Config.FIREBASE_CREDENTIALS_PATH
    if not os.path.exists(cred_path):
        logger.critical(f"Firebase credentials not found at {cred_path}")
        raise FileNotFoundError("Firebase credentials missing")
        
    if os.stat(cred_path).st_size == 0:
        logger.critical("Firebase credentials file is empty")
        raise ValueError("Invalid Firebase credentials")
        
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.critical(f"Firebase initialization failed: {str(e)}")
        raise

def get_firestore() -> firestore.firestore.Client:
    if not firebase_admin._apps:
        init_firebase()
    return firestore.client()