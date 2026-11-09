from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # Local default is SQLite; in production set DATABASE_URL to a Postgres URL (e.g. from Neon).
    database_url: str = f"sqlite:///{BASE_DIR / 'research.db'}"
    max_upload_mb: int = 20

    # Change this in any real deployment (set JWT_SECRET in backend/.env or the host's env vars).
    jwt_secret: str = "dev-only-secret-change-me-in-backend-env-file"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24

    # Comma-separated list of frontend origins allowed to call the API.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # How many panel votes it takes to finalise a submission.
    approvals_required: int = 1
    rejections_required: int = 1

    # When set, demo accounts and sample papers are created on startup (if the DB has no users).
    demo_password: str | None = None

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        # Hosts hand out "postgres://" or "postgresql://"; SQLAlchemy needs the psycopg (v3) driver name.
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
