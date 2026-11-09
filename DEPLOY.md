# Deploying for free

| Part     | Host                              | Free tier notes                                          |
|----------|-----------------------------------|----------------------------------------------------------|
| Database | [Neon](https://neon.tech)         | 0.5 GB Postgres, doesn't expire                          |
| Backend  | [Render](https://render.com)      | Sleeps after 15 min idle; first request takes ~30–60 s   |
| Frontend | [Vercel](https://vercel.com)      | Made for Next.js; deploys on every push to `main`        |

Sign in to each with the GitHub account that owns the repo (hapivictoria). Do the steps in this order: each one gives you a value the next one needs.

## 1. Database (Neon)

1. Create a project (any name, region close to your users).
2. On the project dashboard, click **Connect** and copy the connection string. It looks like
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.

## 2. Backend (Render)

1. **New → Blueprint**, choose the `researchpanel_ngo` repo. Render reads `render.yaml`.
2. Fill in the values it asks for:
   - `DATABASE_URL`: the Neon connection string.
   - `CORS_ORIGINS`: put `http://localhost:3000` for now; you'll replace it in step 4.
   - `DEMO_PASSWORD`: a password for the demo accounts. Keep it private; the repo is public.
3. Deploy. When it's live, open `https://<your-service>.onrender.com/api/health`. You should see `{"status":"ok"}`.
   Copy that base URL (without `/api/health`).

On first start the backend creates the tables and the demo accounts (`researcher@demo.com`, `panel@demo.com`, `panel2@demo.com`, `admin@demo.com`) with your `DEMO_PASSWORD`.

## 3. Frontend (Vercel)

1. **Add New → Project**, import `researchpanel_ngo`.
2. Set **Root Directory** to `frontend`. Vercel detects Next.js.
3. Under **Environment Variables** add `NEXT_PUBLIC_API_URL` = the Render URL from step 2 (no trailing slash).
4. Deploy, then copy your site URL, e.g. `https://researchpanel-ngo.vercel.app`.

## 4. Connect them

In Render → your service → **Environment**, set `CORS_ORIGINS` to the Vercel URL (no trailing slash) and save. Render redeploys automatically. To allow several sites, separate them with commas.

Open the Vercel URL and sign in. Done.

## Before a client demo

- Open the Render URL a minute beforehand so the backend is awake.
- Changing `NEXT_PUBLIC_API_URL` on Vercel only takes effect after a redeploy (Deployments → ⋯ → Redeploy).

## Updating

Push to `main`: Vercel and Render both redeploy automatically.

The database schema is created automatically but not migrated. If a future change alters a table, reset it in Neon (delete and recreate the database, or run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` in the SQL editor) and the backend will recreate everything, including demo data, on its next start.
