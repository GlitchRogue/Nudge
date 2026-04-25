"""4-signal event ranker.

Score = weighted blend of:
  1. Free-time fit (does it fit a gap, including travel buffer)
  2. Interest match (tag overlap against user's stated interests + inferred from past events)
  3. Location (distance from home)
  4. Cost / social (free > paid; popular > unpopular, modestly)

All sub-scores normalize to [0, 1]; final score is a weighted sum.
"""
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from typing import List, Dict, Tuple

from .models import User, Event, CalendarEntry, Action
from .routing import travel_time_minutes, travel_buffer_minutes

# weights (tunable)
W_FIT = 0.40
W_INTEREST = 0.35
W_LOCATION = 0.15
W_COST = 0.10

TRAVEL_BUFFER_MIN = 20  # minutes added to each side


def haversine_km(lat1, lng1, lat2, lng2):
    if None in (lat1, lng1, lat2, lng2):
        return 5.0  # assume 5km if unknown
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def conflict_with_calendar(event: Event, calendar: List[CalendarEntry]) -> Tuple[bool, str]:
    """Return (conflicts, conflicting_title). Only considers future, non-past calendar entries."""
    buffer = timedelta(minutes=TRAVEL_BUFFER_MIN)
    ev_start = event.start_time - buffer
    ev_end = event.end_time + buffer
    for c in calendar:
        if c.is_past:
            continue
        if c.start_time < ev_end and c.end_time > ev_start:
            return True, c.title
    return False, ""


def score_fit(event: Event, calendar: List[CalendarEntry]) -> float:
    """Binary-ish: 0 if conflicts, else favor events further from conflicting edges."""
    conflicts, _ = conflict_with_calendar(event, calendar)
    if conflicts:
        return 0.0
    # Bonus for longer gaps before/after the event
    buffer = timedelta(minutes=30)
    nearest_before = timedelta(hours=24)
    nearest_after = timedelta(hours=24)
    for c in calendar:
        if c.is_past:
            continue
        if c.end_time <= event.start_time:
            gap = event.start_time - c.end_time
            if gap < nearest_before:
                nearest_before = gap
        elif c.start_time >= event.end_time:
            gap = c.start_time - event.end_time
            if gap < nearest_after:
                nearest_after = gap
    # Normalize: if both gaps > 1h, score 1.0; penalize tight transitions
    min_gap = min(nearest_before, nearest_after)
    if min_gap >= timedelta(hours=1):
        return 1.0
    if min_gap >= buffer:
        return 0.8
    return 0.5


def score_interest(event: Event, user_interests: List[str], history_tags: List[str]) -> float:
    """Tag overlap ratio, weighted 70% stated / 30% inferred history."""
    ev_tags = set((event.tags or []))
    if not ev_tags:
        return 0.3
    user_set = set(user_interests or [])
    hist_set = set(history_tags or [])
    stated_overlap = len(ev_tags & user_set) / max(len(ev_tags), 1)
    history_overlap = len(ev_tags & hist_set) / max(len(ev_tags), 1)
    raw = 0.7 * stated_overlap + 0.3 * history_overlap
    # Soft floor so irrelevant events aren't 0
    return max(0.15, min(1.0, raw + 0.15 if raw > 0 else 0.15))


def score_location(event: Event, user: User) -> float:
    """Closer is better. Uses real travel time via OpenRouteService when ORS_API_KEY
    is set (cached); falls back to haversine + walking-pace estimate otherwise.
    <=15min = 1.0, <=30 = 0.7, <=50 = 0.4, else 0.2."""
    if event.location_lat is None or event.location_lng is None:
        return 0.6
    minutes = travel_time_minutes(
        user.home_lat, user.home_lng, event.location_lat, event.location_lng,
    )
    if minutes <= 15:
        return 1.0
    if minutes <= 30:
        return 0.7
    if minutes <= 50:
        return 0.4
    return 0.2


def score_cost(event: Event) -> float:
    """Free = 1.0, <$20 = 0.7, <$50 = 0.4, else 0.2. Popular adds a small boost."""
    if event.cost == 0:
        base = 1.0
    elif event.cost < 20:
        base = 0.7
    elif event.cost < 50:
        base = 0.4
    else:
        base = 0.2
    # Social boost: log-ish on rsvp_count
    rsvp = event.rsvp_count or 0
    if rsvp > 200:
        base = min(1.0, base + 0.1)
    elif rsvp > 50:
        base = min(1.0, base + 0.05)
    return base


def infer_history_tags(calendar: List[CalendarEntry]) -> List[str]:
    """Union of inferred tags on past events."""
    tags: List[str] = []
    for c in calendar:
        if c.is_past and c.inferred_tags:
            tags.extend(c.inferred_tags)
    return tags


def dismissed_event_ids(actions: List[Action]) -> set:
    return {a.event_id for a in actions if a.action_type == "dismiss"}


def rank_events(
    events: List[Event],
    user: User,
    calendar: List[CalendarEntry],
    actions: List[Action],
) -> List[Dict]:
    """Return list of dicts with event + score + signals + conflict flag, sorted by score desc.
    Conflicting events are NOT removed, just scored 0 on fit (so they sink and are dimmed in UI).
    Dismissed events are removed entirely."""
    dismissed = dismissed_event_ids(actions)
    history_tags = infer_history_tags(calendar)

    ranked = []
    now = datetime.utcnow()
    for ev in events:
        if ev.id in dismissed:
            continue
        # Don't show events that already started
        if ev.start_time < now - timedelta(minutes=30):
            continue

        fit = score_fit(ev, calendar)
        interest = score_interest(ev, user.interests or [], history_tags)
        location = score_location(ev, user)
        cost = score_cost(ev)
        conflicts, conflict_title = conflict_with_calendar(ev, calendar)

        total = W_FIT * fit + W_INTEREST * interest + W_LOCATION * location + W_COST * cost

        ranked.append({
            "event": ev,
            "score": round(total, 3),
            "signals": {
                "fit": round(fit, 2),
                "interest": round(interest, 2),
                "location": round(location, 2),
                "cost": round(cost, 2),
            },
            "conflict": conflicts,
            "conflict_title": conflict_title,
            "history_tags": history_tags,
        })
    ranked.sort(key=lambda r: r["score"], reverse=True)
    return ranked
