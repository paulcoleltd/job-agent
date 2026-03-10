# Setup Guide

## Local Development (Docker)

```bash
git clone <repo>
cd job-agent
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Development (without Docker)

### Backend
```bash
cd apps/api
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Run DB migrations
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd apps/web
pnpm install
pnpm dev
```

## Production Deployment

### Backend (Railway / Fly.io)
```bash
# Railway
railway login
railway init
railway up

# Fly.io
fly launch
fly deploy
```

### Frontend (Vercel)
```bash
cd apps/web
vercel deploy --prod
# Set NEXT_PUBLIC_API_URL to your Railway/Fly backend URL
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI features |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `NEXT_PUBLIC_API_URL` | Yes (frontend) | Backend API base URL |
| `OPENAI_API_KEY` | Optional | OpenAI fallback |

## Running Agents Manually

```bash
# Search for jobs
curl -X POST "http://localhost:8000/agents/run?agent_name=job_search"

# Score jobs against your CV
curl -X POST "http://localhost:8000/agents/run?agent_name=job_match"
```
