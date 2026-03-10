from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import UserProfile
from schemas import ProfileUpdate
from datetime import datetime, timezone

router = APIRouter()

@router.get("")
async def get_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"cv_text": None, "skills": [], "preferences": {}}
    return {
        "id": str(profile.id),
        "cv_text": profile.cv_text,
        "skills": profile.skills or [],
        "preferences": profile.preferences or {},
        "updated_at": profile.updated_at
    }

@router.put("")
async def update_profile(data: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile()
        db.add(profile)
    if data.cv_text is not None:
        profile.cv_text = data.cv_text
    if data.skills is not None:
        profile.skills = data.skills
    if data.preferences is not None:
        profile.preferences = data.preferences
    profile.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Profile updated"}
