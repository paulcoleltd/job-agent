from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source: str
    company: str
    title: str
    location: Optional[str] = None
    remote_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    apply_url: Optional[str] = None
    match_score: Optional[float] = None
    status: str
    discovered_at: Optional[datetime] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    submitted_at: Optional[datetime] = None
    submission_mode: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    notes: Optional[str] = None


class ProfileUpdate(BaseModel):
    cv_text: Optional[str] = None
    skills: Optional[List[str]] = None
    preferences: Optional[dict] = None


class AgentRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_name: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    summary: Optional[dict] = None
