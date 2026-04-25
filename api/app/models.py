"""SQLAlchemy models."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
)
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    # Onboarding interest tags (e.g., ["tech", "music", "career"])
    interests = Column(JSON, default=list)
    # Home location, free-form text
    home_location = Column(String, default="NYU Washington Square, New York, NY")
    home_lat = Column(Float, default=40.7295)
    home_lng = Column(Float, default=-73.9965)
    # Google OAuth tokens (null for demo user)
    google_access_token = Column(Text, nullable=True)
    google_refresh_token = Column(Text, nullable=True)
    google_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actions = relationship("Action", back_populates="user")
    calendar_entries = relationship("CalendarEntry", back_populates="user")


class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True)  # source-prefixed, e.g. eb_abc123
    source = Column(String, nullable=False)  # eventbrite|engage|wasserman|gmail
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location_text = Column(String, default="")
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    url = Column(String, default="")
    cost = Column(Float, default=0.0)  # 0 = free
    rsvp_count = Column(Integer, default=0)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class CalendarEntry(Base):
    """Real or mock calendar entries for a user (classes, work, past events)."""
    __tablename__ = "calendar_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location_text = Column(String, default="")
    # Inferred tags on past events (e.g. "ai", "music")
    inferred_tags = Column(JSON, default=list)
    is_past = Column(Boolean, default=False)

    user = relationship("User", back_populates="calendar_entries")


class Action(Base):
    """User feedback on events."""
    __tablename__ = "actions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(String, ForeignKey("events.id"))
    # add_to_calendar | rsvp | save | dismiss | approved
    action_type = Column(String, nullable=False)
    note = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="actions")
