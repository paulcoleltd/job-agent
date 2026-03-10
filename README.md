# Job Agent

AI-powered job hunting assistant. Discovers jobs, scores them against your CV, drafts applications, and tracks outcomes.

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Python 3.11+

### Start with Docker

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
docker-compose up --build
```

Frontend: http://localhost:3000
API: http://localhost:8000
API Docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

## MVP Build Order

1. Upload CV in Settings
2. Click "Find Jobs" on Dashboard
3. Jobs appear — click "Score Jobs" to run matching
4. Shortlist high-match jobs
5. Create and review applications
6. Submit from Applications page

## Safety Rules
- Max 20 applications per day
- No blind bulk submissions
- No duplicate submissions
- CAPTCHA always pauses automation for user
- All submissions require human approval

## Architecture

```
Frontend (Next.js) -> Backend (FastAPI) -> Agent Orchestrator
                                        -> JobSearchAgent (Greenhouse, Lever)
                                        -> JobMatchAgent (CV scoring)
                                        -> ApplicationAgent (Claude AI)
                                        -> TrackingAgent (pipeline)
                                        -> PostgreSQL + Redis
```
