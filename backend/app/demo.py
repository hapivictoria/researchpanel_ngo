"""Demo accounts and sample submissions, used by seed.py and (optionally) on startup."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Decision, Review, Role, Submission, SubmissionStatus, User
from .security import hash_password, verify_password

USERS = [
    ("Ada Researcher", "researcher@demo.com", Role.researcher),
    ("Grace Researcher", "grace@demo.com", Role.researcher),
    ("Dr. Panel One", "panel@demo.com", Role.panel),
    ("Dr. Panel Two", "panel2@demo.com", Role.panel),
    ("Admin", "admin@demo.com", Role.admin),
]

SAMPLES = [
    ("Machine Learning for Early Crop Disease Detection",
     "We evaluate lightweight convolutional models for detecting leaf disease from smartphone images "
     "in low-connectivity farming regions.", "Ada Researcher, J. Okafor", "agriculture, computer vision",
     "researcher@demo.com", None),
    ("Urban Heat Islands and Public Health Outcomes",
     "A city-level study correlating surface temperatures with emergency room visits during heatwaves.",
     "Grace Researcher", "climate, public health", "grace@demo.com", (Decision.approve, "Strong methodology.")),
    ("A Survey of Low-Cost Water Filtration Methods",
     "We compare ceramic, sand and bio-sand filters across cost, throughput and pathogen removal.",
     "Ada Researcher", "water, engineering", "researcher@demo.com",
     (Decision.reject, "Sample size too small to support the conclusions.")),
]

PLACEHOLDER_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
)


def seed_demo(db: Session, password: str) -> list[tuple[str, Role]]:
    """Create demo users (if missing) and sample papers (if the DB has none). Safe to run repeatedly."""
    users: dict[str, User] = {}
    for name, email, role in USERS:
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(name=name, email=email, role=role, password_hash=hash_password(password))
            db.add(user)
        users[email] = user
    db.commit()

    if db.scalar(select(Submission).limit(1)) is None:
        for title, abstract, authors, keywords, owner, review in SAMPLES:
            sub = Submission(title=title, abstract=abstract, authors=authors, keywords=keywords,
                             file_name=f"{title[:40].strip()}.pdf", file_type="application/pdf",
                             file_data=PLACEHOLDER_PDF, submitter_id=users[owner].id)
            if review:
                decision, comment = review
                sub.reviews.append(Review(reviewer_id=users["panel@demo.com"].id, decision=decision, comment=comment))
                sub.status = SubmissionStatus.approved if decision == Decision.approve else SubmissionStatus.rejected
            db.add(sub)
        db.commit()

    return [(email, role) for _, email, role in USERS]


def sync_demo_passwords(db: Session, password: str) -> int:
    """Make every demo account use `password`, so DEMO_PASSWORD is always the source of truth.

    Returns how many accounts were updated. Only touches the fixed demo emails, never real users.
    """
    emails = [email for _, email, _ in USERS]
    updated = 0
    for user in db.scalars(select(User).where(User.email.in_(emails))):
        if not verify_password(password, user.password_hash):
            user.password_hash = hash_password(password)
            updated += 1
    if updated:
        db.commit()
    return updated
