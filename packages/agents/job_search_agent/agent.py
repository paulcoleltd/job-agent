from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Job, AgentRun

class JobSearchAgent:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.name = "job_search"

    async def run(self, query: str = "software engineer"):
        run = AgentRun(agent_name=self.name, status="running")
        self.db.add(run)
        await self.db.commit()

        jobs_found = []
        try:
            from connectors.greenhouse.connector import GreenhouseConnector
            gh = GreenhouseConnector()
            jobs_found += await gh.search(query)
        except Exception as e:
            print(f"Greenhouse error: {e}")

        try:
            from connectors.lever.connector import LeverConnector
            lv = LeverConnector()
            jobs_found += await lv.search(query)
        except Exception as e:
            print(f"Lever error: {e}")

        saved = 0
        for job_data in jobs_found:
            existing = await self.db.execute(
                select(Job).where(
                    Job.source == job_data["source"],
                    Job.source_job_id == job_data["source_job_id"]
                )
            )
            if existing.scalar_one_or_none():
                continue
            job = Job(**job_data)
            self.db.add(job)
            saved += 1

        await self.db.commit()
        run.status = "completed"
        run.ended_at = datetime.now(timezone.utc)
        run.summary = {"jobs_found": len(jobs_found), "jobs_saved": saved}
        await self.db.commit()
        return {"jobs_found": len(jobs_found), "saved": saved}
