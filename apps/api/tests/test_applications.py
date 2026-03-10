"""Tests for /applications endpoints."""
import uuid
import sys, os, asyncio
sys.path.insert(0, os.path.dirname(__file__))
from conftest import AsyncSessionLocal


def seed_job():
    async def _seed():
        from models import Job
        async with AsyncSessionLocal() as db:
            job = Job(source="test", source_job_id=str(uuid.uuid4()), company="TestCo", title="Dev", status="shortlisted")
            db.add(job)
            await db.commit()
            await db.refresh(job)
            return str(job.id)
    return asyncio.get_event_loop().run_until_complete(_seed())


def test_list_applications_empty(client):
    resp = client.get("/applications")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_application(client):
    job_id = seed_job()
    resp = client.post("/applications", json={"job_id": job_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "draft"
    assert data["job_id"] == job_id


def test_get_application(client):
    job_id = seed_job()
    create = client.post("/applications", json={"job_id": job_id})
    app_id = create.json()["id"]
    resp = client.get(f"/applications/{app_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == app_id


def test_get_application_not_found(client):
    resp = client.get(f"/applications/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_submit_application(client):
    job_id = seed_job()
    create = client.post("/applications", json={"job_id": job_id})
    app_id = create.json()["id"]
    resp = client.post(f"/applications/{app_id}/submit")
    assert resp.status_code == 200
    assert resp.json()["status"] == "applied"


def test_submit_application_not_found(client):
    resp = client.post(f"/applications/{uuid.uuid4()}/submit")
    assert resp.status_code == 404


def test_prepare_application_not_found(client):
    resp = client.post(f"/applications/{uuid.uuid4()}/prepare")
    assert resp.status_code == 404


def test_prepare_application_no_job(client):
    """Application without a job_id should 400."""
    async def _seed():
        from models import Application
        async with AsyncSessionLocal() as db:
            app = Application(status="draft")
            db.add(app)
            await db.commit()
            await db.refresh(app)
            return str(app.id)
    app_id = asyncio.get_event_loop().run_until_complete(_seed())
    resp = client.post(f"/applications/{app_id}/prepare")
    assert resp.status_code == 400


def test_create_application_with_notes(client):
    job_id = seed_job()
    resp = client.post("/applications", json={"job_id": job_id, "notes": "Priority role"})
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Priority role"
