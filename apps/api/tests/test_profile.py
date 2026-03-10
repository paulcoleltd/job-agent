"""Tests for /profile endpoints."""


def test_get_profile_empty(client):
    resp = client.get("/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["cv_text"] is None
    assert data["skills"] == []


def test_update_profile_skills(client):
    resp = client.put("/profile", json={"skills": ["Python", "FastAPI", "PostgreSQL"]})
    assert resp.status_code == 200
    assert resp.json()["message"] == "Profile updated"


def test_get_profile_after_update(client):
    client.put("/profile", json={"skills": ["Python", "React"]})
    resp = client.get("/profile")
    assert resp.status_code == 200
    assert "Python" in resp.json()["skills"]
    assert "React" in resp.json()["skills"]


def test_update_profile_cv_text(client):
    client.put("/profile", json={"cv_text": "John Doe — Senior Engineer"})
    resp = client.get("/profile")
    assert resp.json()["cv_text"] == "John Doe — Senior Engineer"


def test_update_profile_preferences(client):
    prefs = {"remote": True, "min_salary": 60000, "locations": ["London", "Remote"]}
    client.put("/profile", json={"preferences": prefs})
    resp = client.get("/profile")
    assert resp.json()["preferences"]["remote"] is True


def test_update_profile_is_idempotent(client):
    client.put("/profile", json={"skills": ["Python"]})
    client.put("/profile", json={"skills": ["Python", "Go"]})
    resp = client.get("/profile")
    assert "Go" in resp.json()["skills"]


def test_update_profile_partial(client):
    """A partial update should not wipe other fields."""
    client.put("/profile", json={"skills": ["Python"], "cv_text": "My CV"})
    client.put("/profile", json={"skills": ["Python", "SQL"]})
    resp = client.get("/profile")
    # cv_text should still be present
    assert resp.json()["cv_text"] == "My CV"
