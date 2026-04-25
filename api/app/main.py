"""FastAPI entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .config import settings
from .db import Base, engine
from .routes import auth, events, actions, agent, user, sources
from . import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed.seed_if_empty()
    # Pull live Luma NYC events at startup. Fails silently if offline so the
    # API can still boot — the seeded events keep the demo working.
    try:
        from .db import SessionLocal
        from .sources import luma
        db = SessionLocal()
        try:
            n = luma.ingest_nyc_into_db(db)
            if n:
                print(f"[startup] Ingested {n} Luma events.")
        finally:
            db.close()
    except Exception as e:
        print(f"[startup] Luma ingestion skipped: {e}")
    yield


app = FastAPI(title="EventPilot API", version="0.1.0", lifespan=lifespan)

# In production (Render), the API is on a different origin from the UI (Vercel),
# so the session cookie must be SameSite=None + Secure. In dev, lax + http is fine.
_is_prod = settings.app_env != "development"
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site="none" if _is_prod else "lax",
    https_only=_is_prod,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in [settings.web_origin, *settings.extra_origins.split(",")]
        if o.strip()
    ],
    # Allow any *.vercel.app preview origin in addition to the explicit list
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(actions.router, prefix="/actions", tags=["actions"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])
app.include_router(sources.router, prefix="/sources", tags=["sources"])


@app.get("/")
def root():
    return {"app": "EventPilot API", "status": "ok", "demo_mode": settings.demo_mode}


@app.get("/health")
def health():
    return {"status": "healthy"}
