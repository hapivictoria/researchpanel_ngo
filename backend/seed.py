"""Create demo accounts and a few sample submissions.

Run from the backend folder:  .venv/bin/python seed.py
The password comes from DEMO_PASSWORD (env var or backend/.env); locally it falls back to "demo1234".
Safe to run more than once (existing demo users are left alone).
"""
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.demo import seed_demo

LOCAL_FALLBACK_PASSWORD = "demo1234"


def main() -> None:
    password = settings.demo_password or LOCAL_FALLBACK_PASSWORD
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        accounts = seed_demo(db, password)
    print("Seeded. Demo logins (password from DEMO_PASSWORD):" if settings.demo_password
          else f"Seeded. Demo logins (local password: {LOCAL_FALLBACK_PASSWORD}):")
    for email, role in accounts:
        print(f"  {role.value:<10} {email}")


if __name__ == "__main__":
    main()
