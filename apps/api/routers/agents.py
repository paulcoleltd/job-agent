from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import AgentRun
from schemas import AgentRunOut
from typing import List

router = APIRouter()

@router.post("/run")
async def run_agent(
    agent_name: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    valid_agents = ["job_search", "job_match", "application", "tracking"]
    if agent_name not in valid_agents:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_name}")

    if agent_name == "job_search":
        from agents.job_search_agent.agent import JobSearchAgent  # resolved via packages/ on sys.path
        agent_obj = JobSearchAgent(db)
        background_tasks.add_task(agent_obj.run, "software engineer")
    elif agent_name == "job_match":
        from agents.job_match_agent.agent import JobMatchAgent
        agent_obj = JobMatchAgent(db)
        background_tasks.add_task(agent_obj.run)
    elif agent_name == "application":
        from agents.application_agent.agent import ApplicationAgent
        agent_obj = ApplicationAgent(db)
        # application agent is per-job; bulk run is a no-op stub
        return {"message": "application agent ready — use POST /applications/{id}/prepare"}
    elif agent_name == "tracking":
        from agents.tracking_agent.agent import TrackingAgent
        agent_obj = TrackingAgent(db)
        background_tasks.add_task(agent_obj.run)

    return {"message": f"{agent_name} agent started"}

@router.get("/runs", response_model=List[AgentRunOut])
async def list_runs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentRun).order_by(AgentRun.started_at.desc()).limit(20))
    return result.scalars().all()
