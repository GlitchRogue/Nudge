"""Refresh ingestion from external sources.

POST /sources/refresh -> pulls fresh events from each enabled source and
                         upserts into the Events table. Returns counts.

Today: Luma + Partiful (URL-based, scans Gmail for invites if signed in).
TODO: Eventbrite live, Socrata, NYU Engage scrape, Wasserman scrape.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..sources import luma
from .user import require_user

router = APIRouter()


@router.post("/refresh")
def refresh_sources(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    counts: Dict[str, int] = {}
    errors: Dict[str, str] = {}

    # Luma NYC
    try:
        counts["luma"] = luma.ingest_nyc_into_db(db)
    except Exception as e:
        errors["luma"] = str(e)
        counts["luma"] = 0

    # Partiful (only if user has Google connected so we can read Gmail)
    if user.google_access_token:
        try:
            from ..sources import gmail_partiful
            from ..google_api import creds_from_user
            creds = creds_from_user(user.google_access_token, user.google_refresh_token)
            counts["partiful"] = gmail_partiful.ingest_for_user(creds, db)
        except Exception as e:
            errors["partiful"] = str(e)
            counts["partiful"] = 0

    return {
        "ok": True,
        "inserted": counts,
        "errors": errors,
    }
