import os
from dotenv import load_dotenv

load_dotenv()

class Config:

    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(32)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 300  
    
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'mustang-secure')
    FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH', '/secrets/firebase.json')
    
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    MESSAGE_TTL = 60  
    
    JWT_ALGORITHM = 'ES256'
    JWT_EXPIRATION = 300  
    
    RATELIMIT_STORAGE_URI = REDIS_URL
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = '100 per minute'
    
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'WARNING')

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    DEBUG = False
    PREFERRED_URL_SCHEME = 'https'

config_dict = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}