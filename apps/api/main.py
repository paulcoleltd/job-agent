import sys
import os

# Make packages/ importable as top-level modules (agents, connectors, ai, scoring)
_PACKAGES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../packages"))
if _PACKAGES_DIR not in sys.path:
    sys.path.insert(0, _PACKAGES_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jobs, applications, agents, documents, profile
from config import settings

app = FastAPI(title="Job Agent API", version="1.0.0")

# In production restrict this to your actual frontend domain
_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
