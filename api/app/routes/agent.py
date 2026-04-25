"""Autonomous-with-approval draft endpoint.

GET /agent/draft -> returns the top-ranked event as a draft calendar entry
                    with proposed start/end (incl. travel buffer) + reasoning.
POST /agent/approve -> user clicks Approve -> we record an 'approved' Action,
                       which the actions route then commits to Calendar if linked.
"""
import asyncio
import os
from datetime import timedelta
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Event, User, CalendarEntry, Action
from ..schemas import AgentDraftOut, EventOut, ActionIn
from ..ranker import rank_events, TRAVEL_BUFFER_MIN
from ..routing import travel_buffer_minutes
from ..llm import generate_reason
from .user import require_user
from .actions import record_action

router = APIRouter()


@router.get("/draft", response_model=AgentDraftOut)
async def draft_top(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    events = db.query(Event).all()
    calendar = db.query(CalendarEntry).filter(CalendarEntry.user_id == user.id).all()
    actions = db.query(Action).filter(Action.user_id == user.id).all()

    ranked = rank_events(events, user, calendar, actions)
    # Skip conflicting events for the agent's top pick
    top = next((r for r in ranked if not r["conflict"]), None)
    if not top:
        raise HTTPException(404, "No suitable event to draft right now.")
    ev = top["event"]
    reason = await generate_reason(
        event_title=ev.title,
        event_description=ev.description or "",
        event_tags=ev.tags or [],
        user_interests=user.interests or [],
        history_tags=top["history_tags"],
        signals=top["signals"],
        conflict=False,
    )

    # Real travel time (ORS) when we have coords; haversine + walking pace otherwise
    buf = travel_buffer_minutes(
        user.home_lat, user.home_lng, ev.location_lat, ev.location_lng,
    )
    return AgentDraftOut(
        event=EventOut.model_validate(ev),
        reason=reason,
        proposed_start=ev.start_time - timedelta(minutes=buf),
        proposed_end=ev.end_time + timedelta(minutes=buf),
        travel_buffer_minutes=buf,
    )


@router.post("/approve")
def approve(
    body: ActionIn,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    body.action_type = "approved"
    return record_action(body, user, db)


# -------------------------------------------------------------------
# Conversational chat endpoint — proxied by the Next.js /api/chat route
# -------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    suggested_event_ids: List[str] = []


CHAT_SYSTEM = """You are Nudge, an AI agent for NYU students.

CRITICAL RULES (NEVER violate):
1. ONLY recommend events that appear EXACTLY in the "Real upcoming events" list below. Copy titles VERBATIM — do not paraphrase, shorten, or rename them.
2. NEVER invent events, dates, times, locations, or speakers. If it's not in the list, it doesn't exist.
3. Always quote the event title exactly as given, then quote the date/time exactly as given.
4. If asked about something not in the list (e.g. "any concerts?" but no concerts listed), say so honestly and offer the closest match from the list.
5. Don't add a date or time unless it appears in the list for that exact event.

Style:
- Concise, direct, friendly. No exclamation points. No emojis.
- 1-3 sentences default. Longer only if asked.
- When recommending: "<title in quotes>" — <when from list> — <one-line why>.

General chat about student life is fine, but always ground event mentions in the list.
"""


# Keyword → list of synonyms/related terms to match against title + tags + description
QUERY_KEYWORDS = {
    "food": ["food", "meal", "dinner", "lunch", "breakfast", "eat", "pizza", "snack", "free food", "cuisine", "taste", "culinary", "dining"],
    "movie": ["movie", "film", "cinema", "screening", "watch"],
    "music": ["music", "concert", "band", "dj", "jazz", "orchestra", "singing", "choir", "perform", "live"],
    "tech": ["tech", "technology", "ai", "machine learning", "ml", "coding", "hackathon", "engineer", "software", "data", "computer", "cs", "startup"],
    "career": ["career", "job", "intern", "internship", "recruit", "recruiter", "professional", "resume", "linkedin", "networking"],
    "finance": ["finance", "investing", "stock", "vc", "venture", "banking", "wall street", "private equity", "trading"],
    "sport": ["sport", "basketball", "soccer", "football", "tennis", "yoga", "run", "gym", "fitness", "intramural"],
    "art": ["art", "gallery", "museum", "painting", "sculpture", "exhibit", "creative", "design"],
    "social": ["social", "party", "meetup", "mixer", "hangout", "happy hour", "club", "friend"],
    "academic": ["lecture", "seminar", "talk", "research", "academic", "professor", "class", "study"],
    "free": ["free", "no cost", "complimentary"],
}


def _filter_events_by_query(events: list[Event], query: str) -> list[Event]:
    """Filter events whose title/tags/description match keywords inferred from the user's query.
    Returns up to 20 most relevant events. If query has no keywords, returns top 20 ranked.
    """
    if not query.strip() or len(events) == 0:
        return events[:20]

    # Find which keyword categories the user is asking about
    matched_terms: set[str] = set()
    for category, terms in QUERY_KEYWORDS.items():
        for term in terms:
            if term in query:
                matched_terms.update(QUERY_KEYWORDS[category])
                break

    # If no category matched, also try raw words from the query (>=4 chars) directly
    if not matched_terms:
        words = [w.strip(".,!?;:\"'") for w in query.split() if len(w) >= 4]
        matched_terms.update(words)

    if not matched_terms:
        return events[:20]

    # Score each event by how many query terms appear in its title/tags/description
    def event_score(ev: Event) -> int:
        haystack = f"{ev.title} {' '.join(ev.tags or [])} {ev.description or ''}".lower()
        # Special case: "free" should also match cost == 0
        score = sum(1 for t in matched_terms if t in haystack)
        if "free" in matched_terms and (ev.cost or 0) == 0:
            score += 1
        return score

    scored = [(event_score(ev), i, ev) for i, ev in enumerate(events)]
    # Keep order stability for same score; prefer higher score
    scored.sort(key=lambda x: (-x[0], x[1]))
    matched = [ev for s, _, ev in scored if s > 0][:20]

    # If filtering removed everything, fall back to top 10 ranked
    if not matched:
        return events[:10]
    return matched


def _format_event_context(events: list[Event], user: User) -> str:
    """Build a short context string of upcoming events for the LLM."""
    lines = []
    for ev in events[:20]:
        tags = ", ".join(ev.tags or [])
        when = ev.start_time.strftime("%a %b %d %I:%M%p") if ev.start_time else "?"
        cost = "free" if (ev.cost or 0) == 0 else f"${ev.cost:.0f}"
        lines.append(
            f"- [{ev.id}] \"{ev.title}\" — {when} @ {ev.location_text or '?'} — {cost} — tags: {tags}"
        )
    interests = ", ".join(user.interests or []) or "general"
    return (
        f"Student interests: {interests}\n\n"
        f"Real upcoming events you can recommend (always pick from this list):\n"
        + "\n".join(lines)
    )


async def _call_anthropic_chat(
    system: str, messages: List[ChatMessage]
) -> str:
    key = settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return ""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 400,
                "system": system,
                "messages": [
                    {"role": m.role, "content": m.content} for m in messages
                ],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"].strip()


async def _call_gemini_chat(
    system: str, messages: List[ChatMessage]
) -> str:
    """Google Gemini chat completion via the v1beta REST API.
    Free tier on aistudio.google.com is sufficient for the demo.
    """
    key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return ""
    # Gemini's API uses 'user'/'model' role names; convert assistant -> model.
    contents = []
    for m in messages:
        role = "model" if m.role == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m.content}]})
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={key}"
    )
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": contents,
                "generationConfig": {
                    "maxOutputTokens": 800,
                    "temperature": 0.6,
                    # Disable extended thinking on 2.5-flash so the entire
                    # token budget goes to the visible reply, not internal reasoning.
                    "thinkingConfig": {"thinkingBudget": 0},
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            return ""


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Conversational endpoint. Pulls upcoming events into context so Claude
    can recommend specific events by title. Returns a single reply string.
    """
    if not body.messages:
        raise HTTPException(400, "messages required")

    events = db.query(Event).order_by(Event.start_time.asc()).all()
    calendar = db.query(CalendarEntry).filter(CalendarEntry.user_id == user.id).all()
    actions = db.query(Action).filter(Action.user_id == user.id).all()
    ranked = rank_events(events, user, calendar, actions)
    ranked_events = [r["event"] for r in ranked]
    if len(ranked_events) < 5:
        ranked_events = events

    # Pre-filter events by the user's last message so Gemini only sees relevant ones.
    last_user_msg = next(
        (m.content for m in reversed(body.messages) if m.role == "user"), ""
    ).lower()
    top_events = _filter_events_by_query(ranked_events, last_user_msg)

    context = _format_event_context(top_events, user)
    system = CHAT_SYSTEM + "\n\n" + context

    # Try LLMs in priority order: Gemini -> Anthropic -> deterministic fallback.
    reply = ""
    for fn, name in (
        (_call_gemini_chat, "gemini"),
        (_call_anthropic_chat, "anthropic"),
    ):
        try:
            reply = await fn(system, body.messages)
            if reply:
                break
        except Exception as e:
            print(f"[chat] {name} call failed: {e}")

    if not reply:
        # Fallback: deterministic top-pick recommendation
        if top_events:
            ev = top_events[0]
            when = ev.start_time.strftime("%a %b %d %I:%M%p")
            reply = (
                f"Top pick right now: \"{ev.title}\" on {when} at "
                f"{ev.location_text or 'TBD'}. Matches your interests."
            )
        else:
            reply = "No upcoming events match your filters yet. Try widening your interests in the profile."

    # Surface up to 4 event IDs the assistant likely referenced.
    # Match by full title OR by significant title words (>=4 chars) appearing in reply.
    reply_lower = reply.lower()
    referenced = []
    seen = set()
    for ev in top_events:
        if ev.id in seen:
            continue
        title_lower = ev.title.lower()
        if title_lower in reply_lower:
            referenced.append(ev.id)
            seen.add(ev.id)
            continue
        # Fuzzy: check if 2+ significant words (>=5 chars) from title appear in reply
        words = [w for w in title_lower.split() if len(w) >= 5]
        if words and sum(1 for w in words if w in reply_lower) >= 2:
            referenced.append(ev.id)
            seen.add(ev.id)
        if len(referenced) >= 4:
            break
    # If LLM didn't name anything specific, still surface the top 2 as fallback chips
    if not referenced and top_events:
        referenced = [ev.id for ev in top_events[:2]]

    return ChatResponse(reply=reply, suggested_event_ids=referenced)
