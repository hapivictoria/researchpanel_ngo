# Run commands

Run the backend and frontend in **two separate terminals**, from `/Users/joyvictoria/Apps/proj/research`.
Both keep running; press `Ctrl+C` to stop.

## Every time

**Terminal 1 — backend** (API on port 8000)

```bash
cd /Users/joyvictoria/Apps/proj/research/backend && .venv/bin/uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend** (site on port 3000)

```bash
cd /Users/joyvictoria/Apps/proj/research/frontend && npm run dev
```

Open http://localhost:3000 · API docs at http://localhost:8000/docs

Local demo accounts: `researcher@demo.com`, `panel@demo.com`, `panel2@demo.com`, `admin@demo.com` with password `demo1234`.
This is local only; the live site uses the `DEMO_PASSWORD` set on Render.

## Only when needed

**First-time setup, or after `requirements.txt` / `package.json` change**

```bash
cd /Users/joyvictoria/Apps/proj/research/backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
cd /Users/joyvictoria/Apps/proj/research/frontend && npm install
```

**Create demo accounts and sample papers** (fresh local database)

```bash
cd /Users/joyvictoria/Apps/proj/research/backend && .venv/bin/python seed.py
```

**Reset the local database** (stop the backend first, then start it again afterwards)

```bash
cd /Users/joyvictoria/Apps/proj/research/backend && rm -f research.db && .venv/bin/python seed.py
```

**"Port already in use"** — a backend is already running; stop it with:

```bash
pkill -f "uvicorn app.main:app"
```

## Live site

| Part     | URL                                        | Deploys from        |
|----------|--------------------------------------------|---------------------|
| Frontend | https://researchpanel-ngo.vercel.app       | Vercel, push to `main` |
| Backend  | https://researchpanel-api.onrender.com     | Render, push to `main` |
| Database | Neon project `researchpanel`               | —                   |

The free backend sleeps after 15 minutes idle; the first request after that takes up to a minute.
