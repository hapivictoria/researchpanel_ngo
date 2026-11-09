from datetime import datetime as _dt, timezone
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from .models import Decision, Role, SubmissionStatus

# SQLite returns naive datetimes; everything is stored in UTC, so mark it as such.
datetime = Annotated[_dt, AfterValidator(lambda v: v if v.tzinfo else v.replace(tzinfo=timezone.utc))]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- auth / users ----
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORM):
    id: int
    name: str
    email: EmailStr
    role: Role


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- reviews ----
class ReviewIn(BaseModel):
    decision: Decision
    comment: str = Field(default="", max_length=5000)


class ReviewOut(ORM):
    id: int
    decision: Decision
    comment: str
    created_at: datetime
    reviewer: UserOut


# ---- submissions ----
class SubmissionOut(ORM):
    id: int
    title: str
    abstract: str
    authors: str
    keywords: str
    file_name: str
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime
    submitter: UserOut
    review_count: int = 0


class SubmissionDetail(SubmissionOut):
    reviews: list[ReviewOut] = []


class StatsOut(BaseModel):
    total: int
    pending: int
    under_review: int
    approved: int
    rejected: int
