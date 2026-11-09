# researchpanel_ngo

A web platform that enables researchers to submit their work for formal evaluation by a designated review panel. Panel members assess each submission and record a decision to approve or reject it, accompanied by written feedback.

The application currently operates under the working title *ResearchReview*.

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS v4: `frontend/`
- **Backend:** Python FastAPI + SQLAlchemy + SQLite, JWT auth: `backend/`

## Run it

**Backend** (port 8000):

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python seed.py              # demo users + sample submissions
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**Frontend** (port 3000):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` if the API is not on `localhost:8000`.

To reset demo data: delete `backend/research.db` and `backend/uploads/`, then run `seed.py` again.

## Demo accounts (password `demo1234`)

| Role       | Email               |
|------------|---------------------|
| Researcher | researcher@demo.com |
| Researcher | grace@demo.com      |
| Panel      | panel@demo.com      |
| Panel      | panel2@demo.com     |
| Admin      | admin@demo.com      |

Public registration always creates **researcher** accounts. Panel and admin accounts come from `seed.py` for now.

## How it works

| Status         | Meaning                                    |
|----------------|--------------------------------------------|
| `pending`      | Uploaded, no panel votes yet               |
| `under_review` | Has votes but no final decision yet        |
| `approved`     | Reached `APPROVALS_REQUIRED` approvals     |
| `rejected`     | Reached `REJECTIONS_REQUIRED` rejections   |

Both thresholds default to 1 (one panelist decides). Set them in `backend/.env` to require multiple votes, for example `APPROVALS_REQUIRED=2`. Each panelist can vote once per submission, and a rejection must include a reason.

## API

| Method | Path                              | Who            |
|--------|-----------------------------------|----------------|
| POST   | `/api/auth/register`              | public         |
| POST   | `/api/auth/login`                 | public         |
| GET    | `/api/auth/me`                    | signed in      |
| GET    | `/api/submissions?status=&q=`     | own / all for panel |
| GET    | `/api/submissions/stats`          | signed in      |
| POST   | `/api/submissions` (multipart)    | signed in      |
| GET    | `/api/submissions/{id}`           | owner / panel  |
| GET    | `/api/submissions/{id}/file`      | owner / panel  |
| POST   | `/api/submissions/{id}/reviews`   | panel / admin  |

Uploads accept PDF and Word files up to 20 MB and are stored in `backend/uploads/`.

## Before production

- Set a strong `JWT_SECRET` in `backend/.env`
- Move from SQLite to Postgres (`DATABASE_URL`) and add migrations (Alembic)
- Store files in object storage (for example S3) instead of local disk
- Add an admin screen for managing panel members
