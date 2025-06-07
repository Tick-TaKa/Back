from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class Purpose(str, Enum):
    reservation = "reservation"
    history = "history"
    refund = "refund"

class LogEvent(BaseModel):
    page: str
    event: str
    target_id: str
    tag: Optional[str] = ""
    url: Optional[str] = ""
    text: Optional[str] = ""
    timestamp: datetime

class CurrentSessionDBRequest(BaseModel):
    sessionId: str
    purpose: Purpose
    location: str
    logs: List[LogEvent]

class CompletedSessionDBRequest(BaseModel):
    purpose: Purpose
    logs: List[List[LogEvent]]
