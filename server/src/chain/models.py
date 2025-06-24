import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class ChainLink(BaseModel):
    message_id: str = Field(..., min_length=16, max_length=64)
    previous_hash: str = Field(..., min_length=64, max_length=64)
    current_hash: str = Field(..., min_length=64, max_length=64)
    ciphertext: bytes
    iv: bytes = Field(..., min_length=12, max_length=12)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    expires_at: datetime.datetime

class ChainVerificationResult(BaseModel):
    is_valid: bool
    message: Optional[str] = None
    invalid_links: List[int] = []

class ChainIntegrityAlert(BaseModel):
    chain_id: str
    invalid_index: int
    expected_hash: str
    actual_hash: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)