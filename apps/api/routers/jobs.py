from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models import Job
from schemas import JobOut
from typing import List, Optional
import uuid

router = APIRouter()

@router.get("/search")
async def search_jobs(
    q: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    from agents.job_search_agent.agent import JobSearchAgent  # resolved via packages/ on sys.path
    agent_obj = JobSearchAgent(db)
    background_tasks.add_task(agent_obj.run, q or "software engineer")
    return {"message": "Job search started", "query": q}

@router.get("", response_model=List[JobOut])
async def list_jobs(
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(Job).order_by(desc(Job.match_score))
    if status:
        query = query.where(Job.status == status)
    if min_score:
        query = query.where(Job.match_score >= min_score)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.patch("/{job_id}/status")
async def update_job_status(job_id: uuid.UUID, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = status
    await db.commit()
    return {"id": str(job_id), "status": status}
