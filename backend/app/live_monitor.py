import asyncio
import logging
import random
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from app.models import LiveEvent, Incident, Alert, AgentPerformanceMetric
from app.database import AsyncSessionLocal
from app.services.demo_data import ATTACK_TYPES, PROTOCOLS, SERVICES, AGENTS

logger = logging.getLogger(__name__)

async def generate_live_event():
    while True:
        await asyncio.sleep(10)
        logger.info("LiveMonitor: Generating synthetic incident.")
        
        is_anomaly = random.random() < 0.3
        
        if is_anomaly:
            attack_type = random.choice(ATTACK_TYPES[1:])
            prediction = "ANOMALY"
            severity = random.choice(["HIGH", "CRITICAL", "MEDIUM"])
        else:
            attack_type = "Normal Traffic"
            prediction = "NORMAL"
            severity = "LOW"
            
        confidence = random.uniform(0.60, 0.99) if is_anomaly else random.uniform(0.80, 0.99)
        ts = datetime.utcnow()
        inc_id = f"INC-LIVE-{uuid.uuid4().hex[:8].upper()}"
        
        async with AsyncSessionLocal() as db:
            # 1. Incident
            inc = Incident(
                incident_id=inc_id,
                timestamp=ts,
                attack_type=attack_type,
                protocol=random.choice(PROTOCOLS),
                service=random.choice(SERVICES),
                severity=severity,
                prediction=prediction,
                confidence=round(confidence, 2),
                status="OPEN" if is_anomaly else "RESOLVED"
            )
            db.add(inc)

            # 2. Alert
            alert_dict = None
            if is_anomaly and severity in ["HIGH", "CRITICAL"]:
                alert = Alert(
                    alert_id=f"AL-LIVE-{uuid.uuid4().hex[:8].upper()}",
                    incident_id=inc_id,
                    trigger=f"Detected {attack_type}",
                    message=f"Live risk {attack_type} detected on {inc.protocol}/{inc.service}",
                    severity=severity,
                    status="OPEN",
                    timestamp=ts
                )
                db.add(alert)
                alert_dict = {
                    "alert_id": alert.alert_id, "severity": alert.severity, 
                    "trigger": alert.trigger, "timestamp": alert.timestamp.isoformat()
                }

            # 3. Agent Metrics
            for agent in AGENTS:
                if random.random() < 0.3:
                    metric = AgentPerformanceMetric(
                        metric_id=f"MET-{uuid.uuid4().hex[:8].upper()}",
                        agent_name=agent,
                        incident_id=inc_id,
                        execution_time_ms=random.uniform(50, 300),
                        confidence_score=random.uniform(0.8, 1.0),
                        success=True,
                        timestamp=ts
                    )
                    db.add(metric)

            await db.commit()
            
            # Broadcast the event
            from app.routers.websocket import manager
            import json
            event_dict = {
                "type": "new_incident",
                "incident_id": inc.incident_id,
                "timestamp": inc.timestamp.isoformat(),
                "protocol": inc.protocol,
                "service": inc.service,
                "prediction": inc.prediction,
                "severity": inc.severity,
                "confidence": inc.confidence,
                "attack_type": inc.attack_type,
                "alert": alert_dict
            }
            await manager.broadcast(json.dumps(event_dict))
