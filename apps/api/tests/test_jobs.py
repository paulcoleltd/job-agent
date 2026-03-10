"""Tests for /jobs endpoints."""
import uuid


def _seed_job(client, **kwargs):
    """Insert a job directly via the DB-backed create approach (no endpoint, so use models)."""
    # We'll test what is exposed via the API — seeding via direct DB in conftest
    pass


def make_job(db_session, **overrides):
    from models import Job
    job = Job(
        source=overrides.get("source", "test"),
        source_job_id=str(uuid.uuid4()),
        company=overrides.get("company", "TestCo"),
        title=overrides.get("title", "Engineer"),
        status=overrides.get("status", "discovered"),
        match_score=overrides.get("match_score", 0.75),
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job


def test_list_jobs_empty(client):
    resp = client.get("/jobs")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_job_not_found(client):
    resp = client.get(f"/jobs/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_update_job_status_not_found(client):
    resp = client.patch(f"/jobs/{uuid.uuid4()}/status?status=shortlisted")
    assert resp.status_code == 404


def test_search_jobs_starts_background_task(client):
    """Search endpoint returns 200 and starts background agent."""
    resp = client.get("/jobs/search?q=python+developer")
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert data["query"] == "python developer"


def test_list_jobs_with_status_filter(client):
    resp = client.get("/jobs?status=shortlisted")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_jobs_with_min_score_filter(client):
    resp = client.get("/jobs?min_score=0.8")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
