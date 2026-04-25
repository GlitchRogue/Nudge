from pydantic import BaseModel
from typing import List, Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class ScheduleItem(BaseModel):
    title: str
    start: str
    end: str


class PreferenceRequest(BaseModel):
    preference: str


class ScheduleChangeRequest(BaseModel):
    old_start: str
    old_end: str
    new_start: str
    new_end: str


class EventRecommendation(BaseModel):
    event_name: str
    category: str
    start: str
    end: str
    source: str
    reason: str