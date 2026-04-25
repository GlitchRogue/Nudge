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


CHAT_SYSTEM = """You are Nudge, an AI scheduling agent for college students in NYC.
You help students find events that fit their interests + free time.

Style:
- Concise, direct, dry. Never sycophantic. Never use exclamation points.
- 1-3 sentences max unless the user asks for detail.
- When recommending events, name the event title in quotes and explain why in <=15 words.
- If the user asks something off-topic, redirect briefly back to events/scheduling.
"""


def _format_event_context(events: list[Event], user: User) -> str:
    """Build a short context string of upcoming events for the LLM."""
    lines = []
    for ev in events[:12]:
        tags = ", ".join(ev.tags or [])
        when = ev.start_time.strftime("%a %b %d %I:%M%p") if ev.start_time else "?"
        cost = "free" if (ev.cost or 0) == 0 else f"${ev.cost:.0f}"
        lines.append(
            f"- [{ev.id}] \"{ev.title}\" — {when} @ {ev.location_text or '?'} — {cost} — tags: {tags}"
        )
    interests = ", ".join(user.interests or []) or "unknown"
    return (
        f"Student interests: {interests}\n\n"
        f"Upcoming events available:\n" + "\n".join(lines)
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
                    "maxOutputTokens": 400,
                    "temperature": 0.6,
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
    top_events = [r["event"] for r in ranked[:12] if not r["conflict"]]

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

    # Surface up to 3 event IDs the assistant likely referenced (by title match)
    referenced = []
    for ev in top_events:
        if ev.title.lower() in reply.lower():
            referenced.append(ev.id)
        if len(referenced) >= 3:
            break

    return ChatResponse(reply=reply, suggested_event_ids=referenced)
