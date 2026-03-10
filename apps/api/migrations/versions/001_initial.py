"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("source_job_id", sa.String(255)),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255)),
        sa.Column("remote_type", sa.String(50)),
        sa.Column("salary_min", sa.Integer),
        sa.Column("salary_max", sa.Integer),
        sa.Column("description", sa.Text),
        sa.Column("requirements", sa.Text),
        sa.Column("apply_url", sa.String(1024)),
        sa.Column("ats_type", sa.String(50)),
        sa.Column("posted_at", sa.DateTime),
        sa.Column("discovered_at", sa.DateTime, server_default=sa.text("now()")),
        sa.Column("match_score", sa.Float),
        sa.Column("status", sa.String(50), server_default="discovered"),
        sa.UniqueConstraint("source", "source_job_id", name="uq_jobs_source"),
    )
    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("version", sa.Integer, server_default="1"),
        sa.Column("file_path", sa.String(1024)),
        sa.Column("metadata", JSONB),
        sa.Column("created_at", sa.DateTime, server_default=sa.text("now()")),
    )
    op.create_table(
        "applications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id")),
        sa.Column("status", sa.String(50), server_default="draft"),
        sa.Column("submitted_at", sa.DateTime),
        sa.Column("resume_version_id", UUID(as_uuid=True)),
        sa.Column("cover_letter_version_id", UUID(as_uuid=True)),
        sa.Column("submission_mode", sa.String(50)),
        sa.Column("notes", sa.Text),
        sa.Column("created_at", sa.DateTime, server_default=sa.text("now()")),
    )
    op.create_table(
        "agent_runs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agent_name", sa.String(100), nullable=False),
        sa.Column("started_at", sa.DateTime, server_default=sa.text("now()")),
        sa.Column("ended_at", sa.DateTime),
        sa.Column("status", sa.String(50), server_default="running"),
        sa.Column("summary", JSONB),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("source", sa.String(100)),
        sa.Column("job_id", UUID(as_uuid=True)),
        sa.Column("details", JSONB),
        sa.Column("created_at", sa.DateTime, server_default=sa.text("now()")),
    )
    op.create_table(
        "user_profile",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("cv_text", sa.Text),
        sa.Column("skills", JSONB),
        sa.Column("preferences", JSONB),
        sa.Column("updated_at", sa.DateTime, server_default=sa.text("now()")),
    )


def downgrade():
    op.drop_table("audit_logs")
    op.drop_table("agent_runs")
    op.drop_table("applications")
    op.drop_table("documents")
    op.drop_table("jobs")
    op.drop_table("user_profile")
