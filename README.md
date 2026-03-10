# Job Agent — AI-Powered Job Hunting Platform

> Discovers jobs, scores them against your CV using Claude AI, builds tailored applications, and tracks your hiring pipeline — all from one dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| State | React Query (server), Zustand (UI), React Hook Form + Zod |
| Backend | FastAPI, Python 3.11+, SQLAlchemy async, Alembic |
| Database | PostgreSQL 15, Redis 7 |
| AI | Anthropic Claude (resume tailoring, cover letters, scoring) |
| Automation | Playwright (form filling, ATS submission) |
| Tests | Vitest + Testing Library (75 tests), pytest (31 tests) |
| Deploy | Docker Compose, Vercel (frontend), Railway (backend) |

---

## Test Status

```
Frontend  75 / 75 passed   (Vitest 4.0 — 10 suites)
Backend   31 / 31 passed   (pytest 9.0 — 5 suites)
Build      9 routes        (Next.js — 0 errors, 0 type errors)
```

---

## Features

- **Dashboard** — KPI strip, pipeline funnel chart, match score distribution, AI agent panel, top matches, recent applications, profile completeness card
- **Job Discovery** — Greenhouse, Lever, Indeed browser connectors; background search agents
- **AI Scoring** — Claude-powered semantic match scoring against your CV
- **Shortlist** — Review, approve, or reject discovered jobs
- **Application Builder** — Claude tailors your CV and writes a cover letter for each role; editable before submitting
- **Applications Pipeline** — Kanban-style status tracking (draft → applied → interview → offer / rejected)
- **Tracker** — Agent run history and pipeline stats
- **Settings** — CV upload (PDF → text extraction), skills profile, preferences
- **Test Dashboard** — Live API health, full test report with per-test timings at `/test-dashboard`

---

## Quick Start (Docker)

```bash
git clone https://github.com/paulcoleltd/job-agent
cd job-agent
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Test Dashboard | http://localhost:3000/test-dashboard |

---

## Local Development

**Backend:**
```bash
cd apps/api
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

**Run tests:**
```bash
# Frontend
cd apps/web
npm test

# Backend
cd apps/api
python -m pytest tests/ -v
```

---

## Project Structure

```
job-agent/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── routers/            # jobs, applications, agents, documents, profile
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── schemas.py          # Pydantic v2 request/response schemas
│   │   ├── migrations/         # Alembic — 001_initial (6 tables)
│   │   └── tests/              # pytest — 31 tests
│   └── web/                    # Next.js 14 frontend
│       └── src/
│           ├── app/            # App Router pages (9 routes)
│           ├── features/       # Page-level feature components
│           ├── components/ui/  # shadcn/ui design system
│           └── lib/            # API client, utils
├── packages/
│   ├── agents/                 # job_search, job_match, application, tracking
│   ├── ai/tools/               # Claude: scorer, cover letter, resume parser
│   ├── connectors/             # Greenhouse, Lever, Indeed, CareerSite
│   ├── automation/playwright/  # ATS form filler worker
│   └── scoring/                # Deterministic fallback scorer
├── infra/
│   ├── db/init.sql             # PostgreSQL schema + pgcrypto
│   ├── docker/                 # Production docker-compose
│   └── observability/          # Prometheus config
├── docs/setup.md               # Full deployment guide
├── docker-compose.yml          # Local full-stack compose
├── railway.json                # Railway backend config
└── .env.example                # Environment variable template
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/jobs` | List jobs (filter by status, min_score) |
| GET | `/jobs/search` | Trigger job search agent |
| PATCH | `/jobs/{id}/status` | Update job status |
| GET | `/applications` | List applications |
| POST | `/applications` | Create application |
| POST | `/applications/{id}/prepare` | AI-generate tailored resume + cover letter |
| POST | `/applications/{id}/submit` | Submit application (daily limit: 20) |
| POST | `/agents/run` | Run an agent (job_search, job_match, application, tracking) |
| GET | `/agents/runs` | Agent run history |
| GET/PUT | `/profile` | User profile and skills |
| POST | `/documents/upload` | Upload CV (PDF → text extraction) |

---

## Deployment

**Vercel (frontend):**
```bash
cd apps/web
vercel --prod
```

**Railway (backend):**
```bash
railway up
```
Set `ANTHROPIC_API_KEY`, `DATABASE_URL`, `REDIS_URL` as Railway environment variables.

**Production Docker Compose:**
```bash
docker compose -f infra/docker/docker-compose.prod.yml up --build
```

---

## Safety Rules

- Max **20 applications per day** (hard-coded rate limit)
- No blind bulk submissions — every application requires human review
- Duplicate detection via `(source, source_job_id)` unique constraint
- CAPTCHA handling pauses automation and notifies user
- All AI-generated content is editable before submission

---

## Environment Variables

See `.env.example` for the full list. The only **required** variable is `ANTHROPIC_API_KEY`.

---

## License

MIT
