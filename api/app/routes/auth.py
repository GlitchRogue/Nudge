"""Google OAuth routes.

Flow:
  GET /auth/google -> redirect to Google consent
  GET /auth/callback?code=&state= -> exchange, upsert user, redirect to WEB_ORIGIN/feed
  POST /auth/logout -> clear session
  GET /auth/demo -> log in as demo user (DEMO_MODE only)
"""
import secrets
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import User
from .. import google_api

router = APIRouter()


def _current_user(request: Request, db: Session) -> User | None:
    uid = request.session.get("user_id")
    if not uid:
        return None
    return db.get(User, uid)


@router.get("/google")
def google_login(request: Request):
    if not settings.google_client_id:
        raise HTTPException(500, "Google OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET in .env, or use /auth/demo.")
    state = secrets.token_urlsafe(16)
    request.session["oauth_state"] = state
    url, verifier = google_api.authorize_url(state)
    request.session["oauth_code_verifier"] = verifier
    return RedirectResponse(url)


@router.get("/callback")
def google_callback(request: Request, code: str = "", state: str = "", db: Session = Depends(get_db)):
    expected = request.session.get("oauth_state")
    if not expected or expected != state:
        raise HTTPException(400, "OAuth state mismatch")
    if not code:
        raise HTTPException(400, "Missing code")

    verifier = request.session.get("oauth_code_verifier", "")
    creds = google_api.exchange_code(code, code_verifier=verifier)
    info = google_api.fetch_userinfo(creds)
    email = info.get("email")
    if not email:
        raise HTTPException(400, "No email returned from Google")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=info.get("name"),
            picture=info.get("picture"),
            interests=[],
        )
        db.add(user)
    user.google_access_token = creds.token
    user.google_refresh_token = creds.refresh_token or user.google_refresh_token
    user.google_token_expiry = creds.expiry
    db.commit()
    db.refresh(user)

    request.session["user_id"] = user.id
    # If first-time user with no interests, send to onboarding
    redirect_path = "/onboard" if not user.interests else "/feed"
    return RedirectResponse(f"{settings.web_origin}{redirect_path}")


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}


@router.get("/demo")
def demo_login(request: Request, db: Session = Depends(get_db)):
    """One-click demo login for the prototype."""
    if not settings.demo_mode:
        raise HTTPException(403, "Demo mode disabled")
    from ..seed import DEMO_EMAIL
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not user:
        raise HTTPException(500, "Demo user not found; restart the API so seed runs.")
    request.session["user_id"] = user.id
    return {"ok": True, "user": {"id": user.id, "email": user.email, "name": user.name}}
