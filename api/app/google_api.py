"""Google OAuth + Calendar + Gmail read helpers.

Scopes are read-only for calendar and gmail. Calendar write is NOT in scope yet for
the prototype (we write a 'proposed' calendar entry into our own DB and require user
approval; a real integration would call Calendar API insert on approve).
"""
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from .config import settings

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",  # for one-click add on approval
    "https://www.googleapis.com/auth/gmail.readonly",
]


def _flow() -> Flow:
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


def authorize_url(state: str):
    flow = _flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )
    return url, flow.code_verifier or ""


def exchange_code(code: str, code_verifier=None) -> Credentials:
    flow = _flow()
    if code_verifier:
        flow.code_verifier = code_verifier
    flow.fetch_token(code=code)
    return flow.credentials


def creds_from_user(access_token: str, refresh_token: Optional[str]) -> Credentials:
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=SCOPES,
    )


def fetch_userinfo(creds: Credentials) -> Dict[str, Any]:
    service = build("oauth2", "v2", credentials=creds, cache_discovery=False)
    return service.userinfo().get().execute()


def fetch_calendar_events(creds: Credentials, days_back: int = 60, days_forward: int = 14) -> List[Dict[str, Any]]:
    """Return both past (for taste inference) and upcoming events from primary calendar."""
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    time_min = (datetime.utcnow() - timedelta(days=days_back)).isoformat() + "Z"
    time_max = (datetime.utcnow() + timedelta(days=days_forward)).isoformat() + "Z"
    events_result = service.events().list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        maxResults=250,
        singleEvents=True,
        orderBy="startTime",
    ).execute()
    return events_result.get("items", [])


def insert_calendar_event(creds: Credentials, summary: str, description: str,
                          start_iso: str, end_iso: str, location: str = "") -> Dict[str, Any]:
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    body = {
        "summary": summary,
        "description": description,
        "location": location,
        "start": {"dateTime": start_iso, "timeZone": "America/New_York"},
        "end": {"dateTime": end_iso, "timeZone": "America/New_York"},
    }
    return service.events().insert(calendarId="primary", body=body).execute()


def fetch_recent_event_like_emails(creds: Credentials, max_results: int = 40) -> List[Dict[str, Any]]:
    """Pull recent Gmail messages likely to contain event info.

    Heuristic: search for keywords like 'RSVP', 'invite', 'event', 'tonight', 'tomorrow'
    in the last 30 days. Returns message subject + snippet + a messageId for deep-linking.
    Parsing into full events is a TODO (regex + LLM extraction).
    """
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    query = "newer_than:30d (rsvp OR invite OR event OR \"you're invited\" OR tonight OR tomorrow)"
    resp = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = resp.get("messages", [])
    out = []
    for m in messages:
        msg = service.users().messages().get(userId="me", id=m["id"], format="metadata",
                                               metadataHeaders=["Subject", "From", "Date"]).execute()
        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        out.append({
            "id": m["id"],
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": msg.get("snippet", ""),
        })
    return out
