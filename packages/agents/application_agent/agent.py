from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Job, Application, UserProfile, AgentRun

class ApplicationAgent:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.name = "application"

    async def prepare_application(self, job_id: str) -> dict:
        job_result = await self.db.execute(select(Job).where(Job.id == job_id))
        job = job_result.scalar_one_or_none()
        if not job:
            return {"error": "Job not found"}

        profile_result = await self.db.execute(select(UserProfile))
        profile = profile_result.scalar_one_or_none()
        cv_text = profile.cv_text if profile else ""

        resume = await self._tailor_resume(job, cv_text)
        cover_letter = await self._generate_cover_letter(job, cv_text)

        return {
            "job_id": job_id,
            "company": job.company,
            "title": job.title,
            "tailored_resume": resume,
            "cover_letter": cover_letter,
            "requires_approval": True
        }

    async def _tailor_resume(self, job: Job, cv_text: str) -> str:
        try:
            import anthropic
            from config import settings
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            message = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": f"Tailor this CV for the job below. Return only the tailored CV text.\n\nCV:\n{cv_text}\n\nJob Title: {job.title}\nCompany: {job.company}\nDescription: {job.description or ''}"
                }]
            )
            return message.content[0].text
        except Exception:
            return cv_text

    async def _generate_cover_letter(self, job: Job, cv_text: str) -> str:
        try:
            import anthropic
            from config import settings
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            message = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=800,
                messages=[{
                    "role": "user",
                    "content": f"Write a concise, professional cover letter for this job application.\n\nApplicant CV:\n{cv_text[:2000]}\n\nJob Title: {job.title}\nCompany: {job.company}\nDescription: {(job.description or '')[:1000]}\n\nReturn only the cover letter text."
                }]
            )
            return message.content[0].text
        except Exception:
            return f"Dear Hiring Manager,\n\nI am writing to express my interest in the {job.title} position at {job.company}.\n\nSincerely"
