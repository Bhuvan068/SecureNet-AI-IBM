import random
import uuid
from datetime import datetime, timedelta
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import (
    Incident, Alert, AgentPerformanceMetric,
    Organization, ThreatIntelligence, ForensicRecord
)
from app.config import settings

logger = logging.getLogger(__name__)

ATTACK_TYPES = ["Normal Traffic", "DoS", "Probe", "R2L", "U2R", "Anomalous Network Behaviour"]
SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
PROTOCOLS = ["TCP", "UDP", "ICMP"]
SERVICES = ["HTTP", "HTTPS", "FTP", "SSH", "SMTP", "DNS"]
AGENTS = [
    "Observer Agent", "Detection Agent", "Threat Reasoning Agent", 
    "Historical Memory Agent", "Threat Intelligence Agent", 
    "Mitigation Agent", "Report Agent"
]

def generate_timestamp(days_ago: int = 30) -> datetime:
    now = datetime.utcnow()
    past = now - timedelta(days=days_ago)
    random_seconds = random.randint(0, int((now - past).total_seconds()))
    return past + timedelta(seconds=random_seconds)

async def init_demo_data(db: AsyncSession):
    # Check if we already have incidents
    count = (await db.execute(select(func.count(Incident.id)))).scalar_one()
    if count > 0:
        logger.info("Database already populated. Skipping demo data generation.")
        return

    logger.info("Database empty. Initializing Demo Data Engine...")

    # Organizations
    org_id = f"ORG-{uuid.uuid4().hex[:8]}"
    org = Organization(organization_id=org_id, organization_name="SecureNet Demo Org", organization_type="Enterprise")
    db.add(org)

    incidents = []
    alerts = []
    agent_metrics = []
    
    total_incidents = 2000
    now = datetime.utcnow()
    
    # Generate Incidents
    for i in range(total_incidents):
        is_normal = random.random() < 0.6
        if is_normal:
            attack_type = "Normal Traffic"
            severity = "LOW"
            prediction = "NORMAL"
        else:
            attack_type = random.choice(ATTACK_TYPES[1:])
            prediction = "ANOMALY"
            if attack_type in ["DoS", "Probe"]:
                severity = random.choices(["MEDIUM", "HIGH"], weights=[0.7, 0.3])[0]
            else:
                severity = random.choices(["HIGH", "CRITICAL"], weights=[0.4, 0.6])[0]
        
        inc_id = f"INC-{now.strftime('%Y')}-{uuid.uuid4().hex[:8].upper()}"
        ts = generate_timestamp(30)
        
        inc = Incident(
            incident_id=inc_id,
            organization_id=org_id,
            timestamp=ts,
            attack_type=attack_type,
            protocol=random.choice(PROTOCOLS),
            service=random.choice(SERVICES),
            severity=severity,
            prediction=prediction,
            confidence=random.uniform(0.75, 0.99) if prediction == "ANOMALY" else random.uniform(0.9, 0.99),
            status=random.choices(["OPEN", "ESCALATED", "RESOLVED"], weights=[0.2, 0.1, 0.7])[0] if severity != "LOW" else "RESOLVED"
        )
        incidents.append(inc)

        # Generate Alerts for non-normal traffic
        if severity in ["HIGH", "CRITICAL"] and random.random() < 0.3:
            alert = Alert(
                alert_id=f"AL-{now.strftime('%Y')}-{uuid.uuid4().hex[:8].upper()}",
                incident_id=inc_id,
                trigger=f"Detected {attack_type} pattern",
                message=f"High risk {attack_type} activity detected on {inc.protocol}/{inc.service}",
                severity=severity,
                status=random.choices(["OPEN", "ESCALATED", "RESOLVED", "DISMISSED"])[0],
                timestamp=ts
            )
            alerts.append(alert)

        # Generate Agent Metrics
        if random.random() < 0.1: # Don't generate for every incident to save time/space
            for agent in AGENTS:
                metrics = AgentPerformanceMetric(
                    metric_id=f"MET-{uuid.uuid4().hex[:8].upper()}",
                    agent_name=agent,
                    incident_id=inc_id,
                    organization_id=org_id,
                    execution_time_ms=random.uniform(50, 500) if agent != "Threat Reasoning Agent" else random.uniform(500, 2500),
                    confidence_score=random.uniform(0.8, 1.0),
                    success=random.random() > 0.05,
                    timestamp=ts
                )
                agent_metrics.append(metrics)

    db.add_all(incidents)
    db.add_all(alerts)
    db.add_all(agent_metrics)
    await db.commit()
    logger.info(f"Demo Data Generated: {len(incidents)} Incidents, {len(alerts)} Alerts, {len(agent_metrics)} Agent Metrics.")
