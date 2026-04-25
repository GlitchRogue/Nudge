"""Action recording: add_to_calendar | rsvp | save | dismiss | approved.

For add_to_calendar: if the user has Google connected, we call the Calendar API.
Otherwise we store an Action row as a mock commit.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event, User, Action, CalendarEntry
from ..schemas import ActionIn
from .. import google_api
from .user import require_user

router = APIRouter()


VALID_ACTIONS = {"add_to_calendar", "rsvp", "save", "dismiss", "approved"}


@router.post("")
def record_action(
    body: ActionIn,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if body.action_type not in VALID_ACTIONS:
        raise HTTPException(400, f"Invalid action_type (must be one of {VALID_ACTIONS})")

    event = db.get(Event, body.event_id)
    if not event:
        raise HTTPException(404, "Event not found")

    action = Action(
        user_id=user.id,
        event_id=event.id,
        action_type=body.action_type,
        note=body.note or "",
    )
    db.add(action)

    # Side-effect: add_to_calendar commits to Google if connected
    calendar_committed = False
    if body.action_type in ("add_to_calendar", "approved"):
        if user.google_access_token:
            try:
                creds = google_api.creds_from_user(user.google_access_token, user.google_refresh_token)
                google_api.insert_calendar_event(
                    creds,
                    summary=f"\U0001F916 {event.title}",
                    description=f"Added by EventPilot.\n\n{event.description}\n\nSource: {event.url}",
                    start_iso=event.start_time.isoformat(),
                    end_iso=event.end_time.isoformat(),
                    location=event.location_text,
                )
                calendar_committed = True
            except Exception as e:
                print(f"[actions] Google Calendar insert failed: {e}")
        # Always record it in our local calendar too (so the ranker knows it's booked)
        db.add(CalendarEntry(
            user_id=user.id,
            title=event.title,
            start_time=event.start_time,
            end_time=event.end_time,
            location_text=event.location_text,
            inferred_tags=event.tags or [],
            is_past=False,
        ))

    db.commit()
    return {
        "ok": True,
        "action_type": body.action_type,
        "calendar_committed": calendar_committed,
        "note": "Committed to Google Calendar" if calendar_committed else "Recorded locally",
    }
