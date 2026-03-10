from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(50), nullable=False)
    source_job_id = Column(String(255))
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    location = Column(String(255))
    remote_type = Column(String(50))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    description = Column(Text)
    requirements = Column(Text)
    apply_url = Column(String(1024))
    ats_type = Column(String(50))
    posted_at = Column(DateTime)
    discovered_at = Column(DateTime, server_default=func.now())
    match_score = Column(Float)
    status = Column(String(50), default="discovered")

class Application(Base):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))
    status = Column(String(50), default="draft")
    submitted_at = Column(DateTime)
    resume_version_id = Column(UUID(as_uuid=True))
    cover_letter_version_id = Column(UUID(as_uuid=True))
    submission_mode = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(Integer, default=1)
    file_path = Column(String(1024))
    doc_metadata = Column("metadata", JSON)
    created_at = Column(DateTime, server_default=func.now())

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name = Column(String(100), nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime)
    status = Column(String(50), default="running")
    summary = Column(JSON)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String(100), nullable=False)
    source = Column(String(100))
    job_id = Column(UUID(as_uuid=True))
    details = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

class UserProfile(Base):
    __tablename__ = "user_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cv_text = Column(Text)
    skills = Column(JSON)
    preferences = Column(JSON)
    updated_at = Column(DateTime, server_default=func.now())
