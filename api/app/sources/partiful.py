"""Partiful URL parser.

Partiful has no public discovery API and most events are friend-locked, so this
adapter doesn't try to "search" Partiful — it just turns a single Partiful event
URL into our unified Event schema. Wire it into the Gmail email parser: when a
message contains a `partiful.com/e/...` link, call `parse_url(link)`.

Strategy:
1. Use Firecrawl to fetch the page rendered HTML + JSON-LD if exposed.
2. First try to extract structured event data from JSON-LD <script> blocks
   (Partiful pages include schema.org/Event metadata).
3. Fall back to regex/heuristics on the rendered markdown for title, date,
   location, host, description.
4. Use Anthropic Claude to clean up the parsed fields if available.

Returned dict matches the Event schema used by the rest of the app:
{
    "id": "partiful_<eventId>",
    "source": "partiful",
    "title": str,
    "description": str,
    "start_time": ISO datetime str,
    "end_time": ISO datetime str (estimated +2h if not given),
    "location_text": str,
    "location_lat": Optional[float],
    "location_lng": Optional[float],
    "url": str,
    "cost": 0.0,
    "rsvp_count": int,
    "tags": list[str],
}
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from . import firecrawl_client


PARTIFUL_URL_RE = re.compile(
    r"https?://(?:www\.)?partiful\.com/e/([a-zA-Z0-9_-]+)",
    re.IGNORECASE,
)


def find_partiful_urls(text: str) -> List[str]:
    """Pull all partiful.com/e/<id> URLs out of an arbitrary string."""
    return list({m.group(0) for m in PARTIFUL_URL_RE.finditer(text or "")})


def event_id_from_url(url: str) -> Optional[str]:
    m = PARTIFUL_URL_RE.search(url or "")
    return m.group(1) if m else None


# ---------- JSON-LD extraction ----------
_JSONLD_RE = re.compile(
    r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)


def _parse_jsonld(html: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for match in _JSONLD_RE.finditer(html or ""):
        raw = match.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, list):
            out.extend(d for d in data if isinstance(d, dict))
        elif isinstance(data, dict):
            out.append(data)
    return out


def _pick_event_node(nodes: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for n in nodes:
        t = n.get("@type") or ""
        if isinstance(t, list):
            if any(str(x).lower() == "event" for x in t):
                return n
        elif "event" in str(t).lower():
            return n
    return None


# ---------- markdown heuristics fallback ----------
_DATE_LINE_RE = re.compile(
    r"(?:[A-Za-z]{3,9}\s+\d{1,2}(?:,\s*\d{4})?\s*(?:[·•,\-]\s*\d{1,2}:\d{2}\s*[APap][Mm])?)",
)


def _heuristic_from_markdown(md: str, url: str) -> Dict[str, Any]:
    md = md or ""
    lines = [l.strip() for l in md.split("\n") if l.strip()]
    title = next(
        (l.lstrip("# ").strip() for l in lines if l.lstrip().startswith("#")),
        "Partiful event",
    )
    date_match = _DATE_LINE_RE.search(md)
    start_str = date_match.group(0) if date_match else ""
    location = ""
    for l in lines:
        if "location" in l.lower() and ":" in l:
            location = l.split(":", 1)[1].strip()
            break
    return {
        "title": title[:200],
        "raw_date": start_str,
        "location_text": location,
        "description": " ".join(lines[:6])[:500],
    }


# ---------- main entrypoint ----------
def parse_url(url: str, geocode: bool = False) -> Dict[str, Any]:
    """Fetch a Partiful event page and return an Event-shaped dict.

    geocode=True will try to attach lat/lng (requires ORS_API_KEY or similar
    geocoder; we don't ship one by default).
    """
    eid = event_id_from_url(url)
    if not eid:
        raise ValueError(f"Not a Partiful URL: {url}")

    data = firecrawl_client.scrape(url, formats=["markdown", "html"])
    md = data.get("markdown") or ""
    html = data.get("html") or ""

    # Prefer schema.org/Event if Partiful exposes it
    nodes = _parse_jsonld(html)
    event_node = _pick_event_node(nodes)

    title = ""
    description = ""
    start_iso = ""
    end_iso = ""
    location_text = ""
    rsvp_count = 0

    if event_node:
        title = str(event_node.get("name") or "").strip()
        description = str(event_node.get("description") or "").strip()
        start_iso = str(event_node.get("startDate") or "")
        end_iso = str(event_node.get("endDate") or "")
        loc = event_node.get("location")
        if isinstance(loc, dict):
            addr = loc.get("address")
            if isinstance(addr, dict):
                parts = [
                    addr.get("streetAddress"),
                    addr.get("addressLocality"),
                    addr.get("addressRegion"),
                ]
                location_text = ", ".join(p for p in parts if p)
            location_text = location_text or str(loc.get("name") or "")
        elif isinstance(loc, str):
            location_text = loc

    # Fill any gaps from markdown heuristics
    if not title or not start_iso:
        h = _heuristic_from_markdown(md, url)
        title = title or h["title"]
        description = description or h["description"]
        if not start_iso and h.get("raw_date"):
            try:
                start_iso = datetime.strptime(h["raw_date"], "%B %d, %Y").isoformat()
            except Exception:
                pass
        location_text = location_text or h["location_text"]

    # Estimate end time if missing
    if start_iso and not end_iso:
        try:
            start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
            end_iso = (start_dt + timedelta(hours=2)).isoformat()
        except Exception:
            pass

    return {
        "id": f"partiful_{eid}",
        "source": "partiful",
        "title": title or "Partiful event",
        "description": description,
        "start_time": start_iso,
        "end_time": end_iso,
        "location_text": location_text,
        "location_lat": None,
        "location_lng": None,
        "url": url,
        "cost": 0.0,
        "rsvp_count": rsvp_count,
        "tags": ["social", "partiful"],
    }


def parse_urls_in_text(text: str) -> List[Dict[str, Any]]:
    """Convenience: pull all Partiful URLs from a string and parse each.

    Returns one Event dict per URL; errors per URL are caught and skipped.
    """
    out: List[Dict[str, Any]] = []
    for url in find_partiful_urls(text):
        try:
            out.append(parse_url(url))
        except Exception as e:
            print(f"[partiful] failed to parse {url}: {e}")
    return out
