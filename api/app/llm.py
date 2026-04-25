"""LLM reasoning layer. Auto-detects Anthropic or OpenAI credentials.

If neither key is set, falls back to a template-based reasoning string
generated from the ranker signals. The stub output is intentionally
convincing so demos work without an API key.
"""
from typing import Dict, List
import os
import httpx

from .config import settings


def _has_anthropic() -> bool:
    return bool(settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY"))


def _has_openai() -> bool:
    return bool(settings.openai_api_key or os.getenv("OPENAI_API_KEY"))


SYSTEM_PROMPT = """You are the reasoning layer of EventPilot, an AI event companion for college students.
Given a student's profile and a candidate event, write a SINGLE sentence (max 30 words) explaining
why this event is a good or questionable match for them. Reference concrete signals when possible:
their interests, past events they've attended, schedule gaps, or cost/location.
Be conversational, specific, and honest (say when it's a stretch). Never start with 'Because' or 'This event'."""


def _template_reason(
    title: str,
    user_interests: List[str],
    history_tags: List[str],
    signals: Dict[str, float],
    conflict: bool,
    conflict_title: str,
) -> str:
    """Deterministic fallback that feels personalized using signal values."""
    if conflict:
        return f"Overlaps your {conflict_title} \u2014 ranked down, but leaving it visible in case you want to skip class."

    matched_interests = []
    # We don't have the tags here cheaply; the caller can enrich, but we work with signals.
    parts = []

    if signals.get("interest", 0) >= 0.55:
        if history_tags:
            parts.append(f"has a similar vibe to the {history_tags[0]} events already on your calendar")
        else:
            tags = ", ".join(user_interests[:2]) if user_interests else "your profile"
            parts.append(f"matches {tags}")
    if signals.get("fit", 0) >= 0.9:
        parts.append("fits a clean gap with travel buffer")
    elif signals.get("fit", 0) >= 0.7:
        parts.append("fits your schedule with a tight transition")
    if signals.get("location", 0) >= 0.9:
        parts.append("is a short walk from your usual spot")
    if signals.get("cost", 0) == 1.0:
        parts.append("is free")

    if not parts:
        return f"Worth a look \u2014 {title} showed up in your feed based on a blended interest and schedule score."
    # Join with commas, use "and" before the last item
    if len(parts) == 1:
        body = parts[0]
    else:
        body = ", ".join(parts[:-1]) + ", and " + parts[-1]
    return "Picked this because it " + body + "."


async def _call_anthropic(prompt: str) -> str:
    key = settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 150,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"].strip()


async def _call_openai(prompt: str) -> str:
    key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 150,
                "temperature": 0.6,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def generate_reason(
    event_title: str,
    event_description: str,
    event_tags: List[str],
    user_interests: List[str],
    history_tags: List[str],
    signals: Dict[str, float],
    conflict: bool,
    conflict_title: str = "",
) -> str:
    """Return a single-sentence reason for the ranked card."""
    # Conflict case is deterministic regardless of backend
    if conflict:
        return _template_reason(event_title, user_interests, history_tags, signals, conflict, conflict_title)

    prompt = (
        f"Student interests: {', '.join(user_interests) or 'unknown'}.\n"
        f"Past events they attended (topics): {', '.join(history_tags) or 'none recorded'}.\n"
        f"Candidate event: \"{event_title}\" \u2014 tags: {', '.join(event_tags) or 'none'}.\n"
        f"Description: {event_description[:300]}\n"
        f"Ranker signals (0-1): fit={signals.get('fit')}, interest={signals.get('interest')}, "
        f"location={signals.get('location')}, cost={signals.get('cost')}.\n"
        f"Write the one-sentence reason."
    )

    try:
        if _has_anthropic():
            return await _call_anthropic(prompt)
        if _has_openai():
            return await _call_openai(prompt)
    except Exception as e:
        # Silently fall back so demos never break
        print(f"[llm] LLM call failed, falling back to template: {e}")

    return _template_reason(event_title, user_interests, history_tags, signals, conflict, conflict_title)
