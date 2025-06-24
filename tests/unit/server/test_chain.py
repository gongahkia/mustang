import unittest
from src.chain.verifier import ChainVerifier
from src.chain.models import ChainLink
from src.chain.persistence import MessageStore
from datetime import datetime, timedelta
import hashlib

class TestChainVerification(unittest.TestCase):
    def setUp(self):
        self.store = MessageStore("redis://localhost:6379/0", ttl=60)
        self.verifier = ChainVerifier(self.store)
    
    def test_verify_valid_chain(self):
        link1 = ChainLink(
            message_id="msg1",
            previous_hash="0"*64,
            current_hash=hashlib.sha256(b"first").hexdigest(),
            ciphertext=b"first",
            iv=b"iv1",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        
        link2_cipher = b"second"
        msg_hash = hashlib.sha256(link2_cipher).digest()
        combined = link1.current_hash.encode() + msg_hash
        link2_hash = hashlib.sha256(combined).hexdigest()
        
        link2 = ChainLink(
            message_id="msg2",
            previous_hash=link1.current_hash,
            current_hash=link2_hash,
            ciphertext=link2_cipher,
            iv=b"iv2",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        
        result = self.verifier.verify_chain([link1, link2])
        self.assertTrue(result.is_valid)
    
    def test_verify_invalid_chain(self):
        link1 = ChainLink(
            message_id="msg1",
            previous_hash="0"*64,
            current_hash=hashlib.sha256(b"first").hexdigest(),
            ciphertext=b"first",
            iv=b"iv1",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        
        link2 = ChainLink(
            message_id="msg2",
            previous_hash=link1.current_hash,
            current_hash="invalid_hash",
            ciphertext=b"tampered",
            iv=b"iv2",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        
        result = self.verifier.verify_chain([link1, link2])
        self.assertFalse(result.is_valid)
        self.assertIn(1, result.invalid_links)
    
    @patch('src.chain.persistence.MessageStore.retrieve_message')
    def test_verify_and_store(self, mock_retrieve):
        prev_link = ChainLink(
            message_id="prev_msg",
            previous_hash="0"*64,
            current_hash="prev_hash",
            ciphertext=b"prev",
            iv=b"iv_prev",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        mock_retrieve.return_value = prev_link
        
        ciphertext = b"new_message"
        msg_hash = hashlib.sha256(ciphertext).digest()
        combined = prev_link.current_hash.encode() + msg_hash
        current_hash = hashlib.sha256(combined).hexdigest()
        
        new_link = ChainLink(
            message_id="new_msg",
            previous_hash=prev_link.current_hash,
            current_hash=current_hash,
            ciphertext=ciphertext,
            iv=b"iv_new",
            expires_at=datetime.utcnow() + timedelta(seconds=60)
        )
        
        result = self.verifier.verify_and_store(new_link)
        self.assertTrue(result)

if __name__ == '__main__':
    unittest.main()