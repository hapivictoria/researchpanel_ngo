import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..config import settings
from ..database import get_db
from ..models import Decision, Review, Role, Submission, SubmissionStatus, User
from ..schemas import ReviewIn, StatsOut, SubmissionDetail, SubmissionOut
from ..security import get_current_user, require_panel

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def _is_panel(user: User) -> bool:
    return user.role in (Role.panel, Role.admin)


def _get_visible(db: Session, submission_id: int, user: User) -> Submission:
    sub = db.scalar(
        select(Submission)
        .where(Submission.id == submission_id)
        .options(selectinload(Submission.reviews).selectinload(Review.reviewer), selectinload(Submission.submitter))
    )
    if sub is None or (not _is_panel(user) and sub.submitter_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Submission not found")
    return sub


def _summary(sub: Submission) -> SubmissionOut:
    out = SubmissionOut.model_validate(sub)
    out.review_count = len(sub.reviews)
    return out


def _recompute_status(sub: Submission) -> None:
    approvals = sum(r.decision == Decision.approve for r in sub.reviews)
    rejections = sum(r.decision == Decision.reject for r in sub.reviews)
    if rejections >= settings.rejections_required:
        sub.status = SubmissionStatus.rejected
    elif approvals >= settings.approvals_required:
        sub.status = SubmissionStatus.approved
    elif sub.reviews:
        sub.status = SubmissionStatus.under_review
    else:
        sub.status = SubmissionStatus.pending


@router.get("", response_model=list[SubmissionOut])
def list_submissions(
    status_filter: SubmissionStatus | None = Query(None, alias="status"),
    q: str | None = Query(None, description="Search title, authors or keywords"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Submission)
        .options(selectinload(Submission.reviews), selectinload(Submission.submitter))
        .order_by(Submission.created_at.desc())
    )
    if not _is_panel(user):
        stmt = stmt.where(Submission.submitter_id == user.id)
    if status_filter:
        stmt = stmt.where(Submission.status == status_filter)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            Submission.title.ilike(like) | Submission.authors.ilike(like) | Submission.keywords.ilike(like)
        )
    return [_summary(s) for s in db.scalars(stmt).all()]


@router.get("/stats", response_model=StatsOut)
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Submission.status, func.count()).group_by(Submission.status)
    if not _is_panel(user):
        stmt = stmt.where(Submission.submitter_id == user.id)
    counts = {s.value: 0 for s in SubmissionStatus}
    for st, n in db.execute(stmt).all():
        counts[st.value] = n
    return StatsOut(total=sum(counts.values()), **counts)


@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    title: str = Form(..., min_length=3, max_length=300),
    abstract: str = Form(..., min_length=10),
    authors: str = Form(..., min_length=1, max_length=500),
    keywords: str = Form("", max_length=500),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original = Path(file.filename or "").name
    ext = Path(original).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF or Word documents are accepted")

    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is empty")
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, f"File exceeds {settings.max_upload_mb} MB")

    stored = f"{uuid.uuid4().hex}{ext}"
    (settings.upload_dir / stored).write_bytes(content)

    sub = Submission(
        title=title.strip(),
        abstract=abstract.strip(),
        authors=authors.strip(),
        keywords=keywords.strip(),
        file_name=original,
        stored_name=stored,
        submitter_id=user.id,
    )
    db.add(sub)
    db.commit()
    return _summary(_get_visible(db, sub.id, user))


@router.get("/{submission_id}", response_model=SubmissionDetail)
def get_submission(submission_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = _get_visible(db, submission_id, user)
    out = SubmissionDetail.model_validate(sub)
    out.review_count = len(sub.reviews)
    return out


@router.get("/{submission_id}/file")
def download_file(submission_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = _get_visible(db, submission_id, user)
    path = settings.upload_dir / sub.stored_name
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File missing on server")
    return FileResponse(path, filename=sub.file_name)


@router.post("/{submission_id}/reviews", response_model=SubmissionDetail, status_code=status.HTTP_201_CREATED)
def review_submission(
    submission_id: int,
    data: ReviewIn,
    user: User = Depends(require_panel),
    db: Session = Depends(get_db),
):
    sub = _get_visible(db, submission_id, user)
    if sub.status in (SubmissionStatus.approved, SubmissionStatus.rejected):
        raise HTTPException(status.HTTP_409_CONFLICT, "A final decision has already been made")
    if data.decision == Decision.reject and not data.comment.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please give a reason when rejecting")

    sub.reviews.append(Review(reviewer_id=user.id, decision=data.decision, comment=data.comment.strip()))
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already reviewed this submission")
    db.refresh(sub)
    _recompute_status(sub)
    db.commit()
    return get_submission(submission_id, user, db)
