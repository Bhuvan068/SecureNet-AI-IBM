"""
Report Agent — Composes SOC-style incident reports and persists
them to the SQLite database.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.schemas import (
    DetectionResult,
    ThreatReasoning,
    HistoricalMatch,
    MitigationPlan,
    IncidentReport,
)

logger = logging.getLogger(__name__)

REPORT_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║            SECURITY INCIDENT REPORT – SecureNet AI           ║
╚══════════════════════════════════════════════════════════════╝

  Incident ID : {incident_id}
  Timestamp   : {timestamp}
  Source      : {source}

──────────────────────────────────────────────────────────────
  DETECTION RESULTS
──────────────────────────────────────────────────────────────
  Prediction  : {prediction}
  Confidence  : {confidence:.1f}%
  Risk Level  : {risk_level}

──────────────────────────────────────────────────────────────
  THREAT ANALYSIS
──────────────────────────────────────────────────────────────
  Attack Type : {attack_type}
  Severity    : {severity}
  Indicators  :
{indicators}

  Reasoning   :
{reasoning}

──────────────────────────────────────────────────────────────
  HISTORICAL COMPARISON
──────────────────────────────────────────────────────────────
  Match Found      : {historical_match}
  Similarity Score : {similarity_score:.1f}%
  Previous Incident: {prev_incident}
  Previous Attack  : {prev_attack}
  Previous Solution: {prev_mitigation}

──────────────────────────────────────────────────────────────
  MITIGATION PLAN
──────────────────────────────────────────────────────────────
  Priority    : {mitigation_priority}
  Actions     :
{actions}

──────────────────────────────────────────────────────────────
  STATUS: {status}
──────────────────────────────────────────────────────────────
"""


class ReportAgent:
    """Generates the incident report structure."""

    def generate(
        self,
        incident_id: str,
        detection: DetectionResult,
        reasoning: ThreatReasoning,
        historical: HistoricalMatch,
        mitigation: MitigationPlan,
        source: str = "manual",
    ) -> tuple[IncidentReport, str]:
        """
        Returns (IncidentReport schema, formatted text report).
        """
        now       = datetime.now(timezone.utc)
        timestamp = now.isoformat()
        status    = "ESCALATED" if detection.risk_level in ("CRITICAL", "HIGH") else "OPEN"

        # Structured report
        report = IncidentReport(
            incident_id=incident_id,
            timestamp=timestamp,
            prediction=detection.prediction,
            confidence=detection.confidence,
            attack_type=reasoning.attack_type,
            severity=reasoning.severity,
            historical_match=historical.found,
            similarity_score=historical.similarity_score,
            previous_solution=historical.previous_mitigation,
            recommendation=(
                "Reuse previous mitigation strategy."
                if historical.found and historical.similarity_score >= 85
                else mitigation.actions[0] if mitigation.actions else "Investigate and escalate."
            ),
            status=status,
        )

        # Text narrative
        indicators_text = "\n".join(f"    • {i}" for i in reasoning.indicators)
        actions_text    = "\n".join(f"    {idx + 1}. {a}" for idx, a in enumerate(mitigation.actions))

        text = REPORT_TEMPLATE.format(
            incident_id=incident_id,
            timestamp=timestamp,
            source=source,
            prediction=detection.prediction,
            confidence=detection.confidence,
            risk_level=detection.risk_level,
            attack_type=reasoning.attack_type,
            severity=reasoning.severity,
            indicators=indicators_text,
            reasoning=f"    {reasoning.reasoning}",
            historical_match="YES" if historical.found else "NO",
            similarity_score=historical.similarity_score,
            prev_incident=historical.incident_id or "N/A",
            prev_attack=historical.previous_attack or "N/A",
            prev_mitigation=historical.previous_mitigation or "N/A",
            mitigation_priority=mitigation.priority,
            actions=actions_text,
            status=status,
        )

        logger.info("ReportAgent: report generated for %s", incident_id)
        return report, text


report_agent = ReportAgent()
