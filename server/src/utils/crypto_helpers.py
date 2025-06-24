import jwt
import hashlib
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from config.settings import Config
import base64
import logging

logger = logging.getLogger(__name__)

def generate_jwt(user_id: str, public_key: str) -> str:
    payload = {
        'sub': user_id,
        'pub_key': public_key,
        'exp': int(datetime.datetime.utcnow().timestamp()) + Config.JWT_EXPIRATION
    }
    return jwt.encode(
        payload,
        Config.SECRET_KEY,
        algorithm=Config.JWT_ALGORITHM
    )

def derive_encryption_key(shared_secret: bytes, salt: bytes = None) -> bytes:
    salt = salt or os.urandom(16)
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,  
        salt=salt,
        info=b'mustang-encryption',
        backend=default_backend()
    )
    return hkdf.derive(shared_secret)

def generate_ec_key_pair() -> tuple:
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()
    
    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_key, pub_bytes.decode('utf-8')

def verify_chain_hash(prev_hash: str, current_hash: str, ciphertext: bytes) -> bool:
    msg_hash = hashlib.sha256(ciphertext).digest()
    combined = prev_hash.encode() + msg_hash
    computed_hash = hashlib.sha256(combined).hexdigest()
    return computed_hash == current_hash

def zeroize_buffer(buf: bytes) -> None:
    if isinstance(buf, bytes):
        mutable = bytearray(buf)
        for i in range(len(mutable)):
            mutable[i] = 0
        buf = bytes(mutable)