"""Travel time helper.

If ORS_API_KEY is set, calls OpenRouteService for realistic travel time.
Otherwise falls back to haversine distance with a walking-pace estimate.

OpenRouteService free tier: 2,000 requests/day, 40/min.
Docs: https://openrouteservice.org/dev/#/api-docs/v2/directions
"""
from __future__ import annotations

import os
from functools import lru_cache
from math import radians, sin, cos, sqrt, atan2
from typing import Optional, Tuple

import httpx

# Walking + subway in NYC averages ~12 km/h door-to-door.
NYC_AVG_SPEED_KMH = 12.0
HAVERSINE_FALLBACK_BUFFER_MIN = 5  # extra padding when we don't know real route


def _ors_key() -> Optional[str]:
    return os.getenv("ORS_API_KEY") or None


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def _haversine_minutes(lat1, lng1, lat2, lng2) -> int:
    km = haversine_km(lat1, lng1, lat2, lng2)
    return int((km / NYC_AVG_SPEED_KMH) * 60) + HAVERSINE_FALLBACK_BUFFER_MIN


def _profile_for_distance(km: float) -> str:
    """Walk under 2km, otherwise drive (proxies for subway/Uber)."""
    return "foot-walking" if km < 2.0 else "driving-car"


@lru_cache(maxsize=512)
def travel_time_minutes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> int:
    """Best-effort travel time in minutes from origin to destination.

    Calls OpenRouteService if ORS_API_KEY is set; otherwise uses a haversine
    estimate. Cached in-memory so repeated lookups for the same pair are free.
    """
    if any(v is None for v in (origin_lat, origin_lng, dest_lat, dest_lng)):
        return 30

    key = _ors_key()
    if not key:
        return _haversine_minutes(origin_lat, origin_lng, dest_lat, dest_lng)

    km_estimate = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    profile = _profile_for_distance(km_estimate)
    url = f"https://api.openrouteservice.org/v2/directions/{profile}"
    body = {
        "coordinates": [[origin_lng, origin_lat], [dest_lng, dest_lat]],
        "units": "m",
    }
    try:
        with httpx.Client(timeout=8.0) as client:
            r = client.post(
                url,
                json=body,
                headers={
                    "Authorization": key,
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            seconds = data["routes"][0]["summary"]["duration"]
            return max(1, int(seconds // 60))
    except Exception as e:
        # Quietly fall back to haversine; never block ranking on a network blip.
        print(f"[routing] ORS call failed ({e}); falling back to haversine.")
        return _haversine_minutes(origin_lat, origin_lng, dest_lat, dest_lng)


def travel_buffer_minutes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: Optional[float],
    dest_lng: Optional[float],
    floor: int = 10,
) -> int:
    """Minutes to budget on the user's calendar before/after the event.

    Ensures a sane minimum (you always need a few minutes to leave).
    """
    if dest_lat is None or dest_lng is None:
        return 20
    raw = travel_time_minutes(origin_lat, origin_lng, dest_lat, dest_lng)
    return max(floor, raw)
