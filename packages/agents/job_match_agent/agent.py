from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Job, AgentRun, UserProfile

class JobMatchAgent:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.name = "job_match"

    async def run(self):
        run = AgentRun(agent_name=self.name, status="running")
        self.db.add(run)
        await self.db.commit()

        profile_result = await self.db.execute(select(UserProfile))
        profile = profile_result.scalar_one_or_none()
        cv_text = profile.cv_text if profile else ""
        skills = profile.skills if profile else []

        jobs_result = await self.db.execute(
            select(Job).where(Job.match_score == None)
        )
        jobs = jobs_result.scalars().all()

        scored = 0
        for job in jobs:
            score = self._score_job(job, cv_text, skills)
            job.match_score = score
            scored += 1

        await self.db.commit()
        run.status = "completed"
        run.ended_at = datetime.now(timezone.utc)
        run.summary = {"jobs_scored": scored}
        await self.db.commit()
        return {"scored": scored}

    def _score_job(self, job: Job, cv_text: str, skills: list) -> float:
        """
        match_score =
          0.35 * skills_match +
          0.20 * seniority_match +
          0.15 * location_match +
          0.10 * salary_match +
          0.10 * domain_match +
          0.10 * resume_strength
        """
        description = (job.description or "").lower()
        requirements = (job.requirements or "").lower()
        cv_lower = cv_text.lower()

        # Skills match
        skills_match = 0.0
        if skills:
            matched = sum(1 for s in skills if s.lower() in description or s.lower() in requirements)
            skills_match = min(matched / max(len(skills), 1), 1.0)

        # Seniority match - basic keyword matching
        seniority_keywords = ["senior", "lead", "principal", "staff", "junior", "mid"]
        seniority_match = 0.5  # neutral default
        for kw in seniority_keywords:
            if kw in description and kw in cv_lower:
                seniority_match = 0.9
                break

        # Location match
        location_match = 0.7  # default neutral
        if job.remote_type in ["remote", "fully_remote"]:
            location_match = 1.0

        # Salary match
        salary_match = 0.5
        if job.salary_min and job.salary_max:
            salary_match = 0.8  # has salary info is good

        # Domain match
        domain_match = 0.5
        tech_keywords = ["python", "javascript", "typescript", "react", "fastapi", "aws", "docker"]
        domain_hits = sum(1 for t in tech_keywords if t in description)
        cv_hits = sum(1 for t in tech_keywords if t in cv_lower)
        if domain_hits > 0 and cv_hits > 0:
            domain_match = min((cv_hits / max(domain_hits, 1)), 1.0)

        # Resume strength
        resume_strength = 0.5 if cv_text else 0.1
        if len(cv_text) > 500:
            resume_strength = 0.8

        score = (
            0.35 * skills_match +
            0.20 * seniority_match +
            0.15 * location_match +
            0.10 * salary_match +
            0.10 * domain_match +
            0.10 * resume_strength
        )
        return round(score, 3)
