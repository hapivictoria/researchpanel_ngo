"""Create demo accounts and a few sample submissions.

Run from the backend folder:  .venv/bin/python seed.py
Safe to run more than once (existing demo users are left alone).
"""
from sqlalchemy import select

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Decision, Review, Role, Submission, SubmissionStatus, User
from app.security import hash_password

DEMO_PASSWORD = "demo1234"

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


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    users: dict[str, User] = {}
    for name, email, role in USERS:
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(name=name, email=email, role=role, password_hash=hash_password(DEMO_PASSWORD))
            db.add(user)
        users[email] = user
    db.commit()

    if db.scalar(select(Submission).limit(1)) is None:
        for i, (title, abstract, authors, keywords, owner, review) in enumerate(SAMPLES):
            stored = f"sample-{i + 1}.pdf"
            (settings.upload_dir / stored).write_bytes(PLACEHOLDER_PDF)
            sub = Submission(title=title, abstract=abstract, authors=authors, keywords=keywords,
                             file_name=f"{title[:40].strip()}.pdf", stored_name=stored,
                             submitter_id=users[owner].id)
            if review:
                decision, comment = review
                sub.reviews.append(Review(reviewer_id=users["panel@demo.com"].id, decision=decision, comment=comment))
                sub.status = SubmissionStatus.approved if decision == Decision.approve else SubmissionStatus.rejected
            db.add(sub)
        db.commit()

    db.close()
    print("Seeded. Demo logins (password: %s):" % DEMO_PASSWORD)
    for _, email, role in USERS:
        print(f"  {role.value:<10} {email}")


if __name__ == "__main__":
    main()
