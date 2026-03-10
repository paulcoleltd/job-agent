"""
Deterministic job scorer — no AI required.
Used as fallback when AI scorer is unavailable or for fast batch scoring.

match_score =
  0.35 * skills_match +
  0.20 * seniority_match +
  0.15 * location_match +
  0.10 * salary_match +
  0.10 * domain_match +
  0.10 * resume_strength
"""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ScoreInput:
    cv_text: str
    skills: List[str]
    job_title: str
    job_description: str
    job_requirements: str
    job_location: Optional[str] = None
    job_remote_type: Optional[str] = None
    job_salary_min: Optional[int] = None
    job_salary_max: Optional[int] = None
    preferred_salary: Optional[int] = None


@dataclass
class ScoreResult:
    skills_match: float
    seniority_match: float
    location_match: float
    salary_match: float
    domain_match: float
    resume_strength: float
    overall: float


SENIORITY_KEYWORDS = {
    "junior": ["junior", "entry", "associate", "graduate"],
    "mid": ["mid", "intermediate", "engineer ii"],
    "senior": ["senior", "sr.", "sr "],
    "lead": ["lead", "principal", "staff"],
}

TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "vue", "angular",
    "fastapi", "django", "flask", "node", "aws", "gcp", "azure",
    "docker", "kubernetes", "postgresql", "redis", "graphql", "rest",
]


def score(inp: ScoreInput) -> ScoreResult:
    desc = (inp.job_description + " " + inp.job_requirements).lower()
    cv = inp.cv_text.lower()

    # Skills match
    skills_match = 0.0
    if inp.skills:
        hits = sum(1 for s in inp.skills if s.lower() in desc)
        skills_match = min(hits / len(inp.skills), 1.0)

    # Seniority match
    title_lower = inp.job_title.lower()
    seniority_match = 0.5
    for level, keywords in SENIORITY_KEYWORDS.items():
        if any(k in title_lower for k in keywords):
            if any(k in cv for k in keywords):
                seniority_match = 0.9
            else:
                seniority_match = 0.3
            break

    # Location match
    location_match = 0.6
    remote_type = (inp.job_remote_type or "").lower()
    if "remote" in remote_type or "remote" in (inp.job_location or "").lower():
        location_match = 1.0
    elif "hybrid" in remote_type:
        location_match = 0.7

    # Salary match
    salary_match = 0.5
    if inp.job_salary_min or inp.job_salary_max:
        salary_match = 0.75
        if inp.preferred_salary and inp.job_salary_max:
            if inp.preferred_salary <= inp.job_salary_max:
                salary_match = 1.0
            elif inp.preferred_salary > inp.job_salary_max * 1.2:
                salary_match = 0.2

    # Domain match — tech keyword overlap between CV and JD
    jd_tech = sum(1 for t in TECH_KEYWORDS if t in desc)
    cv_tech = sum(1 for t in TECH_KEYWORDS if t in cv)
    domain_match = 0.5
    if jd_tech > 0 and cv_tech > 0:
        domain_match = min(cv_tech / max(jd_tech, 1), 1.0)

    # Resume strength
    resume_strength = 0.1
    if len(inp.cv_text) > 200:
        resume_strength = 0.5
    if len(inp.cv_text) > 800:
        resume_strength = 0.8
    if inp.skills and len(inp.skills) >= 5:
        resume_strength = min(resume_strength + 0.1, 1.0)

    overall = round(
        0.35 * skills_match
        + 0.20 * seniority_match
        + 0.15 * location_match
        + 0.10 * salary_match
        + 0.10 * domain_match
        + 0.10 * resume_strength,
        3,
    )

    return ScoreResult(
        skills_match=round(skills_match, 3),
        seniority_match=round(seniority_match, 3),
        location_match=round(location_match, 3),
        salary_match=round(salary_match, 3),
        domain_match=round(domain_match, 3),
        resume_strength=round(resume_strength, 3),
        overall=overall,
    )
