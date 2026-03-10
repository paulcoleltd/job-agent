"""Tests for /agents endpoints."""


def test_run_unknown_agent(client):
    resp = client.post("/agents/run?agent_name=unknown_agent")
    assert resp.status_code == 400
    assert "Unknown agent" in resp.json()["detail"]


def test_run_job_search_agent(client):
    resp = client.post("/agents/run?agent_name=job_search")
    assert resp.status_code == 200
    assert "job_search" in resp.json()["message"]


def test_run_job_match_agent(client):
    resp = client.post("/agents/run?agent_name=job_match")
    assert resp.status_code == 200
    assert "job_match" in resp.json()["message"]


def test_run_tracking_agent(client):
    resp = client.post("/agents/run?agent_name=tracking")
    assert resp.status_code == 200
    assert "tracking" in resp.json()["message"]


def test_run_application_agent(client):
    resp = client.post("/agents/run?agent_name=application")
    assert resp.status_code == 200
    assert "application" in resp.json()["message"]


def test_list_agent_runs_empty(client):
    resp = client.get("/agents/runs")
    assert resp.status_code == 200
    assert resp.json() == []


def test_all_valid_agents_accepted(client):
    for agent in ["job_search", "job_match", "application", "tracking"]:
        resp = client.post(f"/agents/run?agent_name={agent}")
        assert resp.status_code == 200, f"Agent {agent} failed with {resp.status_code}"
