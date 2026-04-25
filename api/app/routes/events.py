"""Ranked event feed endpoint."""
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event, User, CalendarEntry, Action
from ..schemas import EventOut, RankedEvent
from ..ranker import rank_events
from ..llm import generate_reason
from .user import require_user

router = APIRouter()


@router.get("", response_model=list[RankedEvent])
async def list_ranked_events(
    source: str = Query(default=""),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Return events ranked for the current user.

    Query param `source` filters by one of: eventbrite | engage | wasserman | gmail.
    """
    q = db.query(Event)
    if source:
        q = q.filter(Event.source == source)
    events = q.all()

    calendar = db.query(CalendarEntry).filter(CalendarEntry.user_id == user.id).all()
    actions = db.query(Action).filter(Action.user_id == user.id).all()

    ranked = rank_events(events, user, calendar, actions)

    # Budget LLM calls to the top non-conflicting picks. Conflicts short-circuit
    # to a deterministic template in llm.py (free + fast) so we always include them.
    MAX_LLM_CALLS = 20
    llm_budget = MAX_LLM_CALLS
    reason_tasks = []
    for r in ranked:
        # Conflicts are free to generate (template). Non-conflicts may hit the LLM.
        if not r["conflict"]:
            if llm_budget <= 0:
                reason_tasks.append(None)  # sentinel: no task
                continue
            llm_budget -= 1
        ev = r["event"]
        reason_tasks.append(generate_reason(
            event_title=ev.title,
            event_description=ev.description or "",
            event_tags=ev.tags or [],
            user_interests=user.interests or [],
            history_tags=r["history_tags"],
            signals=r["signals"],
            conflict=r["conflict"],
            conflict_title=r["conflict_title"],
        ))

    # Await only the real coroutines
    real_tasks = [t for t in reason_tasks if t is not None]
    real_results = await asyncio.gather(*real_tasks, return_exceptions=True)
    results_iter = iter(real_results)

    out = []
    for r, task in zip(ranked, reason_tasks):
        ev = r["event"]
        if task is None:
            reason = "Lower-ranked pick based on blended interest, fit, location, and cost."
        else:
            res = next(results_iter)
            reason = res if isinstance(res, str) else "Matched on your interests and schedule."
        out.append(RankedEvent(
            event=EventOut.model_validate(ev),
            score=r["score"],
            signals=r["signals"],
            reason=reason,
            conflict=r["conflict"],
        ))
    return out
