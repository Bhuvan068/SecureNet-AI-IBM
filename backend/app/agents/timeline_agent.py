from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AttackTimeline
import uuid
from datetime import datetime

class TimelineAgent:
    """
    Records the autonomous agent execution workflow.
    """
    async def record_step(self, db: AsyncSession, incident_id: str, agent_name: str, duration: float, confidence: float, decision: str):
        timeline = AttackTimeline(
            timeline_id=f"TL-{uuid.uuid4().hex[:6].upper()}",
            incident_id=incident_id,
            agent_name=agent_name,
            start_time=datetime.now(), # In reality, we'd pass start and end
            end_time=datetime.now(),
            duration=duration,
            confidence=confidence,
            status="SUCCESS",
            decision=decision
        )
        db.add(timeline)

timeline_agent = TimelineAgent()
