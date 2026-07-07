"""
Alerting Engine — Evaluates conditions after each pipeline run
and fires alerts (dashboard, webhook, email simulation, SMS simulation).
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert
from app.schemas import AnalysisResponse

logger = logging.getLogger(__name__)


def _alert_id() -> str:
    return f"ALT-{uuid.uuid4().hex[:10].upper()}"


# ─── Alert rule definitions ───────────────────────────────────────────────────

class AlertRule:
    def __init__(self, trigger: str, message_fn, severity: str):
        self.trigger     = trigger
        self.message_fn  = message_fn
        self.severity    = severity

    def evaluate(self, result: AnalysisResponse) -> Optional[str]:
        return self.message_fn(result)


_RULES: List[AlertRule] = [
    AlertRule(
        trigger="CRITICAL_SEVERITY",
        message_fn=lambda r: (
            f"CRITICAL THREAT: {r.threat_reasoning.attack_type} detected — "
            f"Confidence {r.detection.confidence:.1f}% — Incident {r.incident_id}"
        ) if r.detection.risk_level == "CRITICAL" else None,
        severity="CRITICAL",
    ),
    AlertRule(
        trigger="HIGH_CONFIDENCE_ANOMALY",
        message_fn=lambda r: (
            f"High-confidence anomaly ({r.detection.confidence:.1f}%) — "
            f"{r.threat_reasoning.attack_type} — Incident {r.incident_id}"
        ) if r.detection.prediction == "ANOMALY" and r.detection.confidence >= 95 else None,
        severity="HIGH",
    ),
    AlertRule(
        trigger="HIGH_SIMILARITY_MATCH",
        message_fn=lambda r: (
            f"Historical match {r.historical_match.similarity_score:.0f}% — "
            f"Previous: {r.historical_match.previous_attack} — "
            f"Reuse mitigation for incident {r.incident_id}"
        ) if r.historical_match.found and r.historical_match.similarity_score >= 90 else None,
        severity="HIGH",
    ),
    AlertRule(
        trigger="PRIVILEGE_ESCALATION",
        message_fn=lambda r: (
            f"PRIVILEGE ESCALATION detected — {r.threat_reasoning.attack_type} — "
            f"Incident {r.incident_id} — Immediate host isolation required"
        ) if "U2R" in r.threat_reasoning.attack_type or "root" in r.threat_reasoning.attack_type.lower() else None,
        severity="CRITICAL",
    ),
    AlertRule(
        trigger="HIGH_SEVERITY",
        message_fn=lambda r: (
            f"High severity {r.threat_reasoning.attack_type} — "
            f"Risk: {r.detection.risk_level} — Incident {r.incident_id}"
        ) if r.detection.risk_level == "HIGH" else None,
        severity="HIGH",
    ),
]


async def _fire_alert(
    db: AsyncSession,
    trigger: str,
    message: str,
    severity: str,
    incident_id: Optional[str],
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    alert = Alert(
        alert_id=_alert_id(),
        incident_id=incident_id,
        trigger=trigger,
        message=message,
        severity=severity,
        channel="dashboard",
        status="UNREAD",
        metadata=metadata or {},
    )
    db.add(alert)
    logger.info("Alert fired: [%s] %s", trigger, message[:80])


class AlertingEngine:
    """Evaluates rules and persists alerts after each pipeline run."""

    async def evaluate(
        self,
        db: AsyncSession,
        result: AnalysisResponse,
    ) -> List[Dict[str, Any]]:
        fired = []
        for rule in _RULES:
            try:
                message = rule.evaluate(result)
                if message:
                    await _fire_alert(
                        db,
                        trigger=rule.trigger,
                        message=message,
                        severity=rule.severity,
                        incident_id=result.incident_id,
                        metadata={
                            "attack_type":   result.threat_reasoning.attack_type,
                            "confidence":    result.detection.confidence,
                            "risk_level":    result.detection.risk_level,
                            "similarity":    result.historical_match.similarity_score,
                        },
                    )
                    fired.append({"trigger": rule.trigger, "severity": rule.severity, "message": message})
            except Exception as exc:
                logger.error("AlertingEngine rule %s failed: %s", rule.trigger, exc)
        return fired


alerting_engine = AlertingEngine()
