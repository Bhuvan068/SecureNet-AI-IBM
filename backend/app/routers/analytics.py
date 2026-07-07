from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.agents.analytics_agent import AnalyticsAgent
from app.schemas import AgentAnalyticsResponse

router = APIRouter(prefix="/analytics/agents", tags=["analytics"])

@router.get("", response_model=AgentAnalyticsResponse)
async def get_agent_analytics(db: AsyncSession = Depends(get_db)):
    """Fetch complete agent analytics including metrics, trends, errors, throughput, and relationships."""
    try:
        # Generate demo data if empty to ensure graphs appear during demonstrations
        await AnalyticsAgent.generate_demo_data(db)
        
        return await AnalyticsAgent.get_metrics(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/trends")
async def get_agent_trends(db: AsyncSession = Depends(get_db)):
    """Convenience endpoint just for trends."""
    data = await get_agent_analytics(db)
    return data.trends

@router.get("/performance")
async def get_agent_performance(db: AsyncSession = Depends(get_db)):
    data = await get_agent_analytics(db)
    return data.metrics

@router.get("/confidence")
async def get_agent_confidence(db: AsyncSession = Depends(get_db)):
    data = await get_agent_analytics(db)
    return [{"agent_name": m.agent_name, "avg_confidence": m.avg_confidence} for m in data.metrics]

@router.get("/errors")
async def get_agent_errors(db: AsyncSession = Depends(get_db)):
    data = await get_agent_analytics(db)
    return data.errors
