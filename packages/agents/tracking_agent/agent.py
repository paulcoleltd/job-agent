from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import Application, Job, AgentRun

PIPELINE_STATES = ["discovered", "shortlisted", "applied", "interview", "rejected", "offer"]

class TrackingAgent:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.name = "tracking"

    async def run(self):
        run = AgentRun(agent_name=self.name, status="running")
        self.db.add(run)
        await self.db.commit()

        # Check for duplicate applications
        dupes = await self._find_duplicates()

        # Get pipeline summary
        pipeline = await self._pipeline_summary()

        run.status = "completed"
        run.ended_at = datetime.now(timezone.utc)
        run.summary = {"pipeline": pipeline, "duplicates_found": len(dupes)}
        await self.db.commit()
        return {"pipeline": pipeline, "duplicates": dupes}

    async def _find_duplicates(self) -> list:
        result = await self.db.execute(
            select(Application.job_id, func.count(Application.id).label("count"))
            .group_by(Application.job_id)
            .having(func.count(Application.id) > 1)
        )
        return [{"job_id": str(row.job_id), "count": row.count} for row in result]

    async def _pipeline_summary(self) -> dict:
        result = await self.db.execute(
            select(Application.status, func.count(Application.id).label("count"))
            .group_by(Application.status)
        )
        return {row.status: row.count for row in result}
