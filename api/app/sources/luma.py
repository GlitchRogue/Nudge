"""Luma scraper.

Luma's official API is host-side only and gated behind Luma Plus, so we use the
public discovery page at https://luma.com/<city>. Each city page is server-side
rendered Next.js with a `<script id="__NEXT_DATA__">` block that contains the
events for that city. We pull HTML once per refresh, extract the JSON, and
normalize each event to our unified Event schema.

Verified shape on 2026-04-25:
  data["props"]["pageProps"]["initialData"]["data"]["events"]            # ~20
  data["props"]["pageProps"]["initialData"]["data"]["featured_events"]   # ~9

Each item has top-level: api_id, event, guest_count, hosts, ticket_info.
The `event` sub-object has: name, start_at (ISO Z), end_at, url, coordinate
(lat/lng), geo_address_info (full_address / sublocality / city), visibility.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from sqlalchemy.orm import Session

from ..models import Event


_NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
    re.DOTALL,
)

USER_AGENT = "Mozilla/5.0 (EventPilot/0.1; +https://github.com/eventpilot)"

# Tag keyword heuristics. Run on event title + host names.
_TAG_KEYWORDS = {
    "ai":            ["ai ", " ai", "machine learning", "ml ", "llm", "claude", "openai", "anthropic", "gpt", "neural"],
    "tech":          ["tech", "engineer", "developer", "hackathon", "code", "coding", "startup", "founder", "demo day", "product", "design"],
    "career":        ["career", "networking", "recruit", "interview", "info session", "panel"],
    "entrepreneurship": ["founder", "startup", "vc ", "venture", "pitch"],
    "music":         ["concert", "dj", "music", "band", "rave", "live music"],
    "food":          ["dinner", "lunch", "brunch", "food", "ramen", "tasting", "coffee", "drinks", "cocktail"],
    "fitness":       ["yoga", "run", "running club", "pickleball", "soccer", "fitness", "workout"],
    "wellness":      ["meditation", "mindfulness", "wellness", "breathwork"],
    "art":           ["art ", "gallery", "exhibit", "museum"],
    "film":          ["film", "screening", "movie", "cinema"],
    "reading":       ["book", "reading", "literary"],
    "social":        ["meetup", "mixer", "party", "social", "club"],
}


def _heuristic_tags(text: str) -> List[str]:
    if not text:
        return ["social"]
    low = text.lower()
    tags = []
    for tag, kws in _TAG_KEYWORDS.items():
        for kw in kws:
            if kw in low:
                tags.append(tag)
                break
    if not tags:
        tags.append("social")
    # Always include "luma" as a source tag (handy for filters/debugging)
    tags.append("luma")
    return list(dict.fromkeys(tags))  # de-dupe, preserve order


def _to_dt(iso: str) -> Optional[datetime]:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


def fetch_nyc(timeout: float = 15.0) -> List[Dict[str, Any]]:
    """Fetch luma.com/nyc and return Event-shaped dicts ready to insert."""
    return fetch_city("nyc", timeout=timeout)


def fetch_city(slug: str, timeout: float = 15.0) -> List[Dict[str, Any]]:
    """Fetch luma.com/<slug> and return events for that city."""
    url = f"https://luma.com/{slug}"
    with httpx.Client(timeout=timeout, headers={"User-Agent": USER_AGENT}) as client:
        r = client.get(url)
        r.raise_for_status()
        html = r.text

    m = _NEXT_DATA_RE.search(html)
    if not m:
        return []

    try:
        data = json.loads(m.group(1))
    except Exception:
        return []

    blob = (
        data.get("props", {})
            .get("pageProps", {})
            .get("initialData", {})
            .get("data", {})
    )
    items: List[Dict[str, Any]] = list(blob.get("events", []) or [])
    items.extend(blob.get("featured_events", []) or [])

    # featured_events overlaps with events — dedupe by api_id before parsing
    seen: set = set()
    out: List[Dict[str, Any]] = []
    for item in items:
        item_id = (item.get("event") or {}).get("api_id") or item.get("api_id")
        if not item_id or item_id in seen:
            continue
        seen.add(item_id)
        ev = item.get("event") or {}
        api_id = ev.get("api_id") or item.get("api_id")
        if not api_id:
            continue

        name = (ev.get("name") or "").strip()
        if not name:
            continue
        if (ev.get("visibility") or "public") != "public":
            continue

        start_dt = _to_dt(ev.get("start_at") or "")
        end_dt = _to_dt(ev.get("end_at") or "") or (start_dt + timedelta(hours=2) if start_dt else None)
        if not start_dt:
            continue

        coord = ev.get("coordinate") or {}
        lat = coord.get("latitude")
        lng = coord.get("longitude")

        geo = ev.get("geo_address_info") or {}
        location_text = (
            geo.get("full_address")
            or geo.get("short_address")
            or geo.get("city_state")
            or geo.get("city")
            or ""
        )

        ti = item.get("ticket_info") or {}
        is_free = bool(ti.get("is_free"))
        cost = 0.0
        if not is_free and ti.get("price_cents"):
            try:
                cost = float(ti["price_cents"]) / 100.0
            except Exception:
                cost = 0.0

        host_names = [h.get("name") for h in (item.get("hosts") or []) if h.get("name")]
        tag_text = name + " " + " ".join(host_names)

        slug_path = ev.get("url") or api_id
        out.append({
            "id": f"luma_{api_id}",
            "source": "luma",
            "title": name,
            "description": (
                f"Hosted by {', '.join(host_names)}." if host_names else ""
            ),
            "start_time": start_dt,
            "end_time": end_dt,
            "location_text": location_text,
            "location_lat": lat,
            "location_lng": lng,
            "url": f"https://luma.com/{slug_path}",
            "cost": cost,
            "rsvp_count": int(item.get("guest_count") or 0),
            "tags": _heuristic_tags(tag_text),
        })

    return out


# ---------- DB ingestion ----------
def ingest_nyc_into_db(db: Session) -> int:
    """Fetch Luma NYC events and upsert into the Events table.
    Returns count of newly inserted events (skips duplicates by id).
    Commits per-row so a single bad event doesn't blow up the whole batch.
    """
    events = fetch_nyc()
    new_count = 0
    for ev in events:
        if db.get(Event, ev["id"]):
            continue
        try:
            db.add(Event(
                id=ev["id"],
                source=ev["source"],
                title=ev["title"],
                description=ev["description"],
                start_time=ev["start_time"],
                end_time=ev["end_time"],
                location_text=ev["location_text"],
                location_lat=ev["location_lat"],
                location_lng=ev["location_lng"],
                url=ev["url"],
                cost=ev["cost"],
                rsvp_count=ev["rsvp_count"],
                tags=ev["tags"],
            ))
            db.commit()
            new_count += 1
        except Exception as e:
            db.rollback()
            print(f"[luma] skipped {ev['id']}: {e}")
    return new_count
