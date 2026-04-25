"""Pydantic schemas for API I/O."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    picture: Optional[str]
    interests: List[str]
    home_location: str
    connected_google: bool

    class Config:
        from_attributes = True


class InterestsIn(BaseModel):
    interests: List[str]


class EventOut(BaseModel):
    id: str
    source: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    location_text: str
    url: str
    cost: float
    rsvp_count: int
    tags: List[str]

    class Config:
        from_attributes = True


class RankedEvent(BaseModel):
    event: EventOut
    score: float
    signals: dict
    reason: str
    conflict: bool


class ActionIn(BaseModel):
    event_id: str
    action_type: str  # add_to_calendar | rsvp | save | dismiss | approved
    note: Optional[str] = ""


class AgentDraftOut(BaseModel):
    event: EventOut
    reason: str
    proposed_start: datetime
    proposed_end: datetime
    travel_buffer_minutes: int
