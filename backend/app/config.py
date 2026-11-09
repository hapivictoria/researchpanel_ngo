from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{BASE_DIR / 'research.db'}"
    upload_dir: Path = BASE_DIR / "uploads"
    max_upload_mb: int = 20

    # Change this in any real deployment (set JWT_SECRET in backend/.env).
    jwt_secret: str = "dev-only-secret-change-me-in-backend-env-file"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # How many panel votes it takes to finalise a submission.
    approvals_required: int = 1
    rejections_required: int = 1


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
