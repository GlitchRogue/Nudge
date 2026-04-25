"""Seed the signed-in user's real Google Calendar with plausible events.

Drops ~10 events onto the user's primary calendar:
  - 4 past events (so the taste-inference / ranker has signal to work with)
  - 6 upcoming events (classes, commitments) so the feed's schedule-fit demo
    has real conflicts and gaps to work against.

Usage:
    cd api
    source .venv/bin/activate
    # First: make sure the main app is running, sign in through the web UI at
    # http://localhost:3000 as nudge485@gmail.com so the OAuth tokens land in
    # the SQLite DB. You can stop the API after that.
    python seed_real_calendar.py

The script is idempotent: it tags each event it creates with a private
`extendedProperties.private.eventpilot_seed=1` marker, and skips any event
that already carries that marker for the same summary in the same week.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Make the app package importable when run from api/
sys.path.insert(0, str(Path(__file__).parent))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings
from app.db import SessionLocal, engine, Base
from app.models import User
from app.google_api import SCOPES


TZ = "America/New_York"


def get_user_with_tokens() -> User | None:
    """Return the first user that has Google tokens stored."""
    db = SessionLocal()
    try:
        return (
            db.query(User)
            .filter(User.google_access_token.isnot(None))
            .order_by(User.id.desc())
            .first()
        )
    finally:
        db.close()


def build_creds(user: User) -> Credentials:
    creds = Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=SCOPES,
    )
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Write back refreshed token so the main app benefits too
            db = SessionLocal()
            try:
                u = db.get(User, user.id)
                if u:
                    u.google_access_token = creds.token
                    if creds.expiry:
                        u.google_token_expiry = creds.expiry
                    db.commit()
            finally:
                db.close()
    return creds


def days_ago(n: int, hour: int, minute: int = 0) -> datetime:
    now = datetime.now()
    day = datetime(now.year, now.month, now.day) - timedelta(days=n)
    return day.replace(hour=hour, minute=minute)


def days_from_now(n: int, hour: int, minute: int = 0) -> datetime:
    now = datetime.now()
    day = datetime(now.year, now.month, now.day) + timedelta(days=n)
    return day.replace(hour=hour, minute=minute)


# (title, description, start, end, location)
# Past events exist to feed the taste-inference signal. Tag-ish titles help.
PAST_EVENTS = [
    (
        "Claude x NYU: AI Agents Meetup",
        "Lightning talks on building AI agents. Great crowd from Anthropic and local startups.",
        days_ago(10, 18, 0),
        days_ago(10, 20, 0),
        "NYU Center for Data Science",
    ),
    (
        "Python NYC Hack Night",
        "Monthly hack night. Built a small CLI tool this time.",
        days_ago(22, 18, 30),
        days_ago(22, 21, 0),
        "WeWork, Soho, NYC",
    ),
    (
        "NYC Startup Week: Founder Fireside",
        "Panel with seed-stage founders talking about first year mistakes.",
        days_ago(34, 18, 0),
        days_ago(34, 20, 0),
        "Brookfield Place, NYC",
    ),
    (
        "OpenAI DevDay Watch Party",
        "Watched keynote with the ML club. Good discussion after.",
        days_ago(48, 12, 0),
        days_ago(48, 14, 0),
        "NYU Paulson Center",
    ),
]

# Upcoming events shape the ranker's schedule-fit view during the demo.
UPCOMING_EVENTS = [
    (
        "CS-UY 301: Algorithms (Lecture)",
        "Weekly lecture.",
        days_from_now(1, 10, 0),
        days_from_now(1, 11, 15),
        "Courant 109",
    ),
    (
        "CSCI-UA 472: Intro to AI",
        "Weekly lecture.",
        days_from_now(2, 14, 0),
        days_from_now(2, 15, 30),
        "Warren Weaver 101",
    ),
    (
        "Coffee with mentor",
        "Career chat with Jordan.",
        days_from_now(3, 9, 0),
        days_from_now(3, 10, 0),
        "Blue Bottle, West Village",
    ),
    (
        "Study group: Midterm review",
        "Algorithms midterm prep with the CS group.",
        days_from_now(4, 16, 0),
        days_from_now(4, 18, 0),
        "Bobst Library, 4th floor",
    ),
    (
        "RA shift",
        "Weekly RA duty block.",
        days_from_now(5, 9, 0),
        days_from_now(5, 13, 0),
        "Third North",
    ),
    (
        "Alex's birthday dinner",
        "Dinner for Alex's birthday. Wear anything but jeans (their rule, not mine).",
        days_from_now(6, 20, 0),
        days_from_now(6, 22, 0),
        "Emmy Squared, LES",
    ),
]


def iso(dt: datetime) -> str:
    """Return ISO string without offset so Google interprets it in the supplied timezone."""
    return dt.replace(microsecond=0).isoformat()


def already_seeded(service) -> set[str]:
    """Return summaries of already-seeded events (to avoid duplicates on re-run)."""
    existing: set[str] = set()
    time_min = (datetime.now() - timedelta(days=90)).isoformat() + "Z"
    time_max = (datetime.now() + timedelta(days=30)).isoformat() + "Z"
    page_token = None
    while True:
        resp = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            privateExtendedProperty="eventpilot_seed=1",
            pageToken=page_token,
            maxResults=250,
        ).execute()
        for item in resp.get("items", []):
            existing.add(item.get("summary", ""))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return existing


def insert(service, title: str, description: str, start: datetime, end: datetime, location: str) -> str:
    body = {
        "summary": title,
        "description": description + "\n\n(Seeded by EventPilot demo seeder.)",
        "location": location,
        "start": {"dateTime": iso(start), "timeZone": TZ},
        "end": {"dateTime": iso(end), "timeZone": TZ},
        "extendedProperties": {
            "private": {"eventpilot_seed": "1"},
        },
    }
    created = service.events().insert(calendarId="primary", body=body).execute()
    return created.get("htmlLink", "")


def main() -> int:
    # Ensure DB tables exist (safe even if the main app has already run).
    Base.metadata.create_all(bind=engine)

    user = get_user_with_tokens()
    if not user:
        print("No user with Google tokens found in the DB.")
        print()
        print("Do this first:")
        print("  1. Start the API:  uvicorn app.main:app --reload --port 8000")
        print("  2. Start the web:  cd ../web && npm run dev")
        print("  3. Open http://localhost:3000 and click 'Sign in with Google'.")
        print("  4. Finish the Google consent flow.")
        print("  5. Re-run this script.")
        return 1

    print(f"Using tokens for: {user.email}")
    creds = build_creds(user)
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)

    print("Checking for already-seeded events...")
    existing = already_seeded(service)
    if existing:
        print(f"  Found {len(existing)} previously seeded event(s), will skip those.")

    inserted = 0
    skipped = 0
    for title, desc, start, end, loc in PAST_EVENTS + UPCOMING_EVENTS:
        if title in existing:
            print(f"  - SKIP (already seeded): {title}")
            skipped += 1
            continue
        try:
            link = insert(service, title, desc, start, end, loc)
            when = start.strftime("%a %b %d %I:%M%p")
            print(f"  + INSERT: [{when}]  {title}")
            inserted += 1
        except Exception as e:
            print(f"  ! FAILED: {title} -- {e}")

    print()
    print(f"Done. Inserted {inserted} events, skipped {skipped}.")
    print("Open https://calendar.google.com to view them.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
