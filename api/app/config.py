"""Environment configuration for EventPilot API."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # General
    app_env: str = "development"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    web_origin: str = "http://localhost:3000"
    # Comma-separated list of additional allowed origins (Vercel preview/prod URLs)
    extra_origins: str = ""
    session_secret: str = "change-me-in-prod"
    database_url: str = "sqlite:///./eventpilot.db"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/callback"

    # LLM keys (auto-detect; priority: gemini > anthropic > openai > template fallback)
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # Eventbrite (optional, for live adapter)
    eventbrite_token: str = ""

    # Demo mode: if true, inject a demo user and skip real OAuth for testing
    demo_mode: bool = True


settings = Settings()
