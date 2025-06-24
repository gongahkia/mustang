import hashlib
from .models import ChainLink, ChainVerificationResult, ChainIntegrityAlert
from .persistence import MessageStore
from config.settings import Config
import logging

logger = logging.getLogger(__name__)

class ChainVerifier:
    def __init__(self, store: MessageStore):
        self.store = store
        
    def verify_chain(self, chain: list[ChainLink]) -> ChainVerificationResult:
        if not chain:
            return ChainVerificationResult(is_valid=True)
            
        invalid_links = []
        
        if chain[0].previous_hash != '0'*64:
            invalid_links.append(0)
            
        for i in range(1, len(chain)):
            prev_link = chain[i-1]
            current_link = chain[i]
            
            msg_hash = hashlib.sha256(current_link.ciphertext).digest()
            combined = prev_link.current_hash.encode() + msg_hash
            expected_hash = hashlib.sha256(combined).hexdigest()
            
            if expected_hash != current_link.current_hash:
                logger.warning(
                    f"Chain mismatch at index {i}: "
                    f"Expected {expected_hash[:12]}... "
                    f"Got {current_link.current_hash[:12]}..."
                )
                invalid_links.append(i)
                
        is_valid = len(invalid_links) == 0
        message = "Chain valid" if is_valid else f"Invalid links: {invalid_links}"
        
        return ChainVerificationResult(
            is_valid=is_valid,
            message=message,
            invalid_links=invalid_links
        )
        
    def verify_and_store(self, chain_link: ChainLink) -> bool:
        prev_link = self.store.retrieve_message(chain_link.previous_hash)
        
        if not prev_link:
            if chain_link.previous_hash != '0'*64:
                return False
            return self.store.store_message(chain_link.message_id, chain_link)
            
        msg_hash = hashlib.sha256(chain_link.ciphertext).digest()
        combined = prev_link.current_hash.encode() + msg_hash
        expected_hash = hashlib.sha256(combined).hexdigest()
        
        if expected_hash != chain_link.current_hash:
            return False
            
        return self.store.store_message(chain_link.message_id, chain_link)