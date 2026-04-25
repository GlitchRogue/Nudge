"""Pull Partiful invites out of the user's Gmail.

Searches Gmail for messages containing partiful.com URLs, parses each URL,
and upserts the resulting events into the local DB so they show up in the feed.

Hook this into the Google sign-in success handler (or run on demand from a
'/sources/refresh' endpoint).
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from .. import google_api  # existing helper in your project
from ..models import Event
from . import partiful


def _to_dt(iso: str) -> Optional[datetime]:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception:
        return None


def ingest_for_user(creds, db: Session) -> int:
    """Scan recent event-like Gmail messages for Partiful URLs and ingest them.
    Returns the number of new events inserted.
    """
    new_count = 0

    msgs = google_api.fetch_recent_event_like_emails(creds, max_results=80)
    for m in msgs:
        text = " ".join([m.get("subject", ""), m.get("snippet", "")])
        events = partiful.parse_urls_in_text(text)
        for ev in events:
            if db.get(Event, ev["id"]):
                continue
            start = _to_dt(ev["start_time"])
            end = _to_dt(ev["end_time"])
            if not start:
                continue
            db.add(Event(
                id=ev["id"],
                source=ev["source"],
                title=ev["title"],
                description=ev["description"],
                start_time=start,
                end_time=end or start,
                location_text=ev["location_text"],
                location_lat=ev["location_lat"],
                location_lng=ev["location_lng"],
                url=ev["url"],
                cost=ev["cost"],
                rsvp_count=ev["rsvp_count"],
                tags=ev["tags"],
            ))
            new_count += 1
    db.commit()
    return new_count
