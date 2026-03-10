from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class JobOut(BaseModel):
    id: uuid.UUID
    source: str
    company: str
    title: str
    location: Optional[str]
    remote_type: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    description: Optional[str]
    apply_url: Optional[str]
    match_score: Optional[float]
    status: str
    discovered_at: Optional[datetime]

    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    submitted_at: Optional[datetime]
    submission_mode: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    cv_text: Optional[str] = None
    skills: Optional[List[str]] = None
    preferences: Optional[dict] = None

class AgentRunOut(BaseModel):
    id: uuid.UUID
    agent_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    status: str
    summary: Optional[dict]

    class Config:
        from_attributes = True
