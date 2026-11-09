import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    researcher = "researcher"
    panel = "panel"
    admin = "admin"


class SubmissionStatus(str, enum.Enum):
    pending = "pending"            # uploaded, no panel votes yet
    under_review = "under_review"  # some votes, not yet decided
    approved = "approved"
    rejected = "rejected"


class Decision(str, enum.Enum):
    approve = "approve"
    reject = "reject"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.researcher)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    submissions: Mapped[list["Submission"]] = relationship(back_populates="submitter")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    abstract: Mapped[str] = mapped_column(Text)
    authors: Mapped[str] = mapped_column(String(500))
    keywords: Mapped[str] = mapped_column(String(500), default="")
    file_name: Mapped[str] = mapped_column(String(300))   # original name shown to users
    stored_name: Mapped[str] = mapped_column(String(300))  # name on disk
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus), default=SubmissionStatus.pending, index=True
    )
    submitter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    submitter: Mapped[User] = relationship(back_populates="submissions")
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan", order_by="Review.created_at"
    )


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("submission_id", "reviewer_id", name="one_review_per_panelist"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    decision: Mapped[Decision] = mapped_column(Enum(Decision))
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    submission: Mapped[Submission] = relationship(back_populates="reviews")
    reviewer: Mapped[User] = relationship()
