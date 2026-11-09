from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .config import settings
from .database import Base, SessionLocal, engine
from .demo import seed_demo
from .models import User
from .routers import auth, submissions


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    # On a fresh deployment, create demo data when DEMO_PASSWORD is configured.
    if settings.demo_password:
        with SessionLocal() as db:
            if db.scalar(select(User).limit(1)) is None:
                seed_demo(db, settings.demo_password)
    yield


app = FastAPI(title="Research Review API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(submissions.router)


@app.get("/")
def root():
    return {"name": "Research Review API", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
