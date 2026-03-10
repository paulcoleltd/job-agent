from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Application, Job
from schemas import ApplicationOut, ApplicationCreate
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.get("", response_model=List[ApplicationOut])
async def list_applications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).order_by(Application.created_at.desc()))
    return result.scalars().all()

@router.post("", response_model=ApplicationOut)
async def create_application(data: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app = Application(job_id=data.job_id, notes=data.notes)
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app

@router.get("/{app_id}", response_model=ApplicationOut)
async def get_application(app_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.post("/{app_id}/prepare")
async def prepare_application(app_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if not app.job_id:
        raise HTTPException(status_code=400, detail="Application has no associated job")

    from agents.application_agent.agent import ApplicationAgent
    agent = ApplicationAgent(db)
    prepared = await agent.prepare_application(str(app.job_id))
    return prepared

@router.post("/{app_id}/submit")
async def submit_application(app_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check daily limit
    from sqlalchemy import func
    today_count = await db.execute(
        select(func.count(Application.id)).where(
            Application.submitted_at >= datetime.now(timezone.utc).date()
        )
    )
    count = today_count.scalar()
    if count >= 20:
        raise HTTPException(status_code=429, detail="Daily application limit (20) reached")

    app.status = "applied"
    app.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"id": str(app_id), "status": "applied"}
