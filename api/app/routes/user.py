"""User endpoints: /user/me, /user/interests."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import UserOut, InterestsIn

router = APIRouter()


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    uid = request.session.get("user_id")
    if not uid:
        raise HTTPException(401, "Not authenticated")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(401, "User not found")
    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(require_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        interests=user.interests or [],
        home_location=user.home_location or "",
        connected_google=bool(user.google_access_token),
    )


@router.post("/interests", response_model=UserOut)
def set_interests(
    body: InterestsIn,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    user.interests = list(set(body.interests))
    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        interests=user.interests or [],
        home_location=user.home_location or "",
        connected_google=bool(user.google_access_token),
    )
