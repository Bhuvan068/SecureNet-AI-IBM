import time
import uuid
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import DemoRun
from app.pipeline import run_pipeline

class DemoEngine:
    async def run_scenario(self, db: AsyncSession, scenario: str):
        # 1. Store initial demo intent
        demo_id = f"DEMO-{uuid.uuid4().hex[:6].upper()}"
        start_time = time.time()
        
        # We will create a fake payload based on the scenario
        payload = {
            "duration": 0,
            "protocol_type": "tcp",
            "service": "http",
            "src_bytes": 54000 if "DDoS" in scenario or "DoS" in scenario else 100,
            "count": 1000 if "DDoS" in scenario else 10
        }

        # 2. Trigger the pipeline
        result = await run_pipeline(payload, db, source="demo")
        
        end_time = time.time()
        
        # 3. Store DemoRun metadata
        run = DemoRun(
            demo_id=demo_id,
            scenario=scenario,
            incident_id=result.incident_id,
            risk_score=result.detection.confidence, # simplified
            historical_match=result.historical_match.similarity_score,
            execution_time=round(end_time - start_time, 2),
            status="COMPLETED"
        )
        db.add(run)
        await db.commit()
        
        return {
            "demo_id": demo_id,
            "scenario": scenario,
            "execution_time": round(end_time - start_time, 2),
            "incident_id": result.incident_id
        }

demo_engine = DemoEngine()
