"""Thin Firecrawl wrapper.

Used by domain-specific scrapers (Partiful, NYU Engage, Wasserman) so they all
share the same auth + retry + timeout policy.

Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
Free plan: 500 pages/month + bonus credits.
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

import httpx


FIRECRAWL_BASE = "https://api.firecrawl.dev/v1"


def _key() -> Optional[str]:
    return os.getenv("FIRECRAWL_API_KEY") or None


def scrape(
    url: str,
    formats: Optional[list[str]] = None,
    only_main_content: bool = True,
    timeout: float = 25.0,
) -> Dict[str, Any]:
    """Scrape a single URL and return Firecrawl's `data` payload.

    formats: list of "markdown", "html", "rawHtml", "links", "screenshot",
             "extract". Defaults to ["markdown"].
    """
    key = _key()
    if not key:
        raise RuntimeError("FIRECRAWL_API_KEY not set in environment.")

    payload = {
        "url": url,
        "formats": formats or ["markdown"],
        "onlyMainContent": only_main_content,
    }

    with httpx.Client(timeout=timeout) as client:
        r = client.post(
            f"{FIRECRAWL_BASE}/scrape",
            json=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
        )
        r.raise_for_status()
        body = r.json()
    if not body.get("success"):
        raise RuntimeError(f"Firecrawl scrape failed for {url}: {body}")
    return body.get("data", {})
