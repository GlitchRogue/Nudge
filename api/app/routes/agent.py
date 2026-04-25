"""Autonomous-with-approval draft endpoint.

GET /agent/draft -> returns the top-ranked event as a draft calendar entry
                    with proposed start/end (incl. travel buffer) + reasoning.
POST /agent/approve -> user clicks Approve -> we record an 'approved' Action,
                       which the actions route then commits to Calendar if linked.
"""
import asyncio
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event, User, CalendarEntry, Action
from ..schemas import AgentDraftOut, EventOut, ActionIn
from ..ranker import rank_events, TRAVEL_BUFFER_MIN
from ..routing import travel_buffer_minutes
from ..llm import generate_reason
from .user import require_user
from .actions import record_action

router = APIRouter()


@router.get("/draft", response_model=AgentDraftOut)
async def draft_top(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    events = db.query(Event).all()
    calendar = db.query(CalendarEntry).filter(CalendarEntry.user_id == user.id).all()
    actions = db.query(Action).filter(Action.user_id == user.id).all()

    ranked = rank_events(events, user, calendar, actions)
    # Skip conflicting events for the agent's top pick
    top = next((r for r in ranked if not r["conflict"]), None)
    if not top:
        raise HTTPException(404, "No suitable event to draft right now.")
    ev = top["event"]
    reason = await generate_reason(
        event_title=ev.title,
        event_description=ev.description or "",
        event_tags=ev.tags or [],
        user_interests=user.interests or [],
        history_tags=top["history_tags"],
        signals=top["signals"],
        conflict=False,
    )

    # Real travel time (ORS) when we have coords; haversine + walking pace otherwise
    buf = travel_buffer_minutes(
        user.home_lat, user.home_lng, ev.location_lat, ev.location_lng,
    )
    return AgentDraftOut(
        event=EventOut.model_validate(ev),
        reason=reason,
        proposed_start=ev.start_time - timedelta(minutes=buf),
        proposed_end=ev.end_time + timedelta(minutes=buf),
        travel_buffer_minutes=buf,
    )


@router.post("/approve")
def approve(
    body: ActionIn,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    body.action_type = "approved"
    return record_action(body, user, db)
