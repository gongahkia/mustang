import redis
from datetime import timedelta
from .models import ChainLink
from config.settings import Config
import msgpack
import logging

logger = logging.getLogger(__name__)

class MessageStore:
    def __init__(self, redis_url: str, ttl: int = Config.MESSAGE_TTL):
        self.redis = redis.Redis.from_url(redis_url, decode_responses=False)
        self.ttl = ttl
        
    def store_message(self, message_id: str, chain_link: ChainLink) -> bool:
        try:
            serialized = msgpack.packb(chain_link.dict())
            return self.redis.setex(
                f"msg:{message_id}", 
                timedelta(seconds=self.ttl), 
                serialized
            )
        except Exception as e:
            logger.error(f"Storage failed for {message_id}: {str(e)}")
            return False
            
    def retrieve_message(self, message_id: str) -> Optional[ChainLink]:
        try:
            serialized = self.redis.get(f"msg:{message_id}")
            if serialized:
                data = msgpack.unpackb(serialized)
                return ChainLink(**data)
            return None
        except Exception as e:
            logger.error(f"Retrieval failed for {message_id}: {str(e)}")
            return None
            
    def delete_message(self, message_id: str) -> bool:
        return self.redis.delete(f"msg:{message_id}") > 0
        
    def get_remaining_ttl(self, message_id: str) -> int:
        return self.redis.ttl(f"msg:{message_id}")