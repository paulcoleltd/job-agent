CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    source_job_id VARCHAR(255),
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    remote_type VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT,
    apply_url VARCHAR(1024),
    ats_type VARCHAR(50),
    posted_at TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT NOW(),
    match_score FLOAT,
    status VARCHAR(50) DEFAULT 'discovered',
    UNIQUE(source, source_job_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    resume_version_id UUID,
    cover_letter_version_id UUID,
    submission_mode VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    file_path VARCHAR(1024),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    summary JSONB
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    source VARCHAR(100),
    job_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_text TEXT,
    skills JSONB,
    preferences JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
