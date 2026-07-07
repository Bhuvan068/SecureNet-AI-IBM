"""
Multi-Agent Pipeline — Orchestrates the full Observer-Executor workflow
with Audit Log instrumentation, Alerting, and Mitigation Comparison.
"""
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.observer_agent import observer_agent
from app.agents.detection_agent import detection_agent
from app.agents.threat_reasoning_agent import threat_reasoning_agent
from app.agents.historical_memory_agent import historical_memory_agent
from app.agents.mitigation_agent import mitigation_agent
from app.agents.report_agent import report_agent
from app.agents.audit_log_agent import audit_log_agent
from app.agents.alerting_engine import alerting_engine
from app.agents.threat_intel_agent import threat_intel_agent
from app.agents.forensics_agent import forensics_agent
from app.models import Incident, MitigationComparison
from app.schemas import AnalysisResponse, NetworkFeatures

logger = logging.getLogger(__name__)


def _generate_incident_id() -> str:
    year  = datetime.now(timezone.utc).year
    short = uuid.uuid4().hex[:6].upper()
    return f"INC-{year}-{short}"


def _cmp_id() -> str:
    return f"CMP-{uuid.uuid4().hex[:10].upper()}"


async def _build_comparison(
    db: AsyncSession,
    incident_id: str,
    historical,
    mitigation,
) -> Optional[MitigationComparison]:
    """Persist mitigation comparison record when a historical match exists."""
    if not historical.found:
        return None

    # Simulate historical success rate based on outcome
    outcome = (historical.outcome or "").upper()
    success_rate = 0.97 if outcome == "RESOLVED" else 0.72 if outcome == "ESCALATED" else 0.85

    cmp = MitigationComparison(
        comparison_id=_cmp_id(),
        incident_id=incident_id,
        historical_incident_id=historical.incident_id,
        similarity_score=historical.similarity_score,
        historical_mitigation=historical.previous_mitigation,
        historical_resolution_time="~15 minutes",  # stored in DB for real incidents
        historical_success_rate=round(success_rate * 100, 1),
        recommendation=(
            "Reuse previous mitigation strategy."
            if historical.similarity_score >= 85
            else "Adapt previous strategy to current threat profile."
        ),
    )
    db.add(cmp)
    return cmp


async def run_pipeline(
    raw_features: Dict[str, Any],
    db: AsyncSession,
    source: str = "manual",
) -> AnalysisResponse:
    """
    Full Observer-Executor multi-agent pipeline with audit instrumentation.
    """
    incident_id = _generate_incident_id()
    logger.info("Pipeline START  incident=%s  source=%s", incident_id, source)

    # ── Agent 1: Observer ──────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ObserverAgent",
                                      input_data={"raw_keys": list(raw_features.keys())}) as ctx:
        features: NetworkFeatures = observer_agent.validate_and_normalise(raw_features)
        ctx["output"]   = {"validated": True, "protocol": features.protocol_type}
        ctx["decision"] = "Features validated and normalised"
        ctx["confidence"] = 1.0

    # ── Agent 2: Detection ─────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "DetectionAgent",
                                      input_data={"protocol": features.protocol_type,
                                                  "service": features.service}) as ctx:
        detection = await detection_agent.detect(features)
        ctx["output"]    = {"prediction": detection.prediction, "risk": detection.risk_level}
        ctx["decision"]  = detection.prediction
        ctx["confidence"] = detection.confidence / 100

    # ── Agent 3: Threat Reasoning ──────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ThreatReasoningAgent",
                                      input_data={"prediction": detection.prediction,
                                                  "confidence": detection.confidence}) as ctx:
        reasoning = await threat_reasoning_agent.analyse(features, detection)
        ctx["output"]    = {"attack_type": reasoning.attack_type, "severity": reasoning.severity}
        ctx["decision"]  = reasoning.attack_type
        ctx["confidence"] = detection.confidence / 100

    # ── Agent 4: Historical Memory ─────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "HistoricalMemoryAgent",
                                      input_data={"attack_type": reasoning.attack_type}) as ctx:
        historical = await historical_memory_agent.search(db, features, reasoning)
        ctx["output"]    = {"found": historical.found, "similarity": historical.similarity_score}
        ctx["decision"]  = f"Match: {historical.found} ({historical.similarity_score:.1f}%)"
        ctx["confidence"] = historical.similarity_score / 100

    # ── Comparison Engine ──────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ComparisonEngine",
                                      input_data={"similarity": historical.similarity_score}) as ctx:
        await _build_comparison(db, incident_id, historical, mitigation_agent)
        ctx["output"]   = {"reuse": historical.similarity_score >= 85}
        ctx["decision"] = "Reuse previous strategy" if historical.similarity_score >= 85 else "Generate new strategy"
        ctx["confidence"] = historical.similarity_score / 100

    # ── Agent 5: Mitigation ────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "MitigationAgent",
                                      input_data={"attack_type": reasoning.attack_type,
                                                  "risk_level": detection.risk_level}) as ctx:
        mitigation = mitigation_agent.generate(reasoning, detection, historical)
        ctx["output"]    = {"priority": mitigation.priority, "actions": len(mitigation.actions)}
        ctx["decision"]  = f"Priority: {mitigation.priority}"
        ctx["confidence"] = detection.confidence / 100

    # ── Agent 6: Report ────────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ReportAgent",
                                      input_data={"incident_id": incident_id}) as ctx:
        report_schema, report_text = report_agent.generate(
            incident_id, detection, reasoning, historical, mitigation, source
        )
        ctx["output"]    = {"status": report_schema.status}
        ctx["decision"]  = report_schema.status
        ctx["confidence"] = detection.confidence / 100

    # ── Threat Intelligence Agent ──────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ThreatIntelAgent", input_data={}) as ctx:
        intel = await threat_intel_agent.analyze(db, incident_id, features, reasoning)
        ctx["output"] = {"reputation": intel["reputation"], "mitre": intel["mitre"]}
        ctx["decision"] = "Mapped threat intelligence"
        ctx["confidence"] = 1.0

    # ── Forensics Agent ────────────────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "ForensicsAgent", input_data={}) as ctx:
        forensics = await forensics_agent.preserve(db, incident_id, raw_features, reasoning)
        ctx["output"] = {"fingerprint": forensics["fingerprint"]}
        ctx["decision"] = "Preserved digital evidence"
        ctx["confidence"] = 1.0

    # ── Risk Assessment Agent (Formula Update) ─────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "RiskAssessmentAgent", input_data={}) as ctx:
        # Calculate new Risk Score = (Severity + Confidence + Historical Frequency + Mitigation Failure Rate) / 4
        # Normalizing to 0-100 scale
        sev_map = {"LOW": 20, "MEDIUM": 50, "HIGH": 80, "CRITICAL": 100}
        sev_val = sev_map.get(reasoning.severity.upper(), 50)
        conf_val = detection.confidence
        freq_val = 80 if historical.found else 20
        fail_val = 100 - (97 if historical.outcome == "RESOLVED" else 72)
        
        raw_risk_score = (sev_val + conf_val + freq_val + fail_val) / 4
        
        if raw_risk_score <= 30: new_risk_level = "LOW"
        elif raw_risk_score <= 60: new_risk_level = "MEDIUM"
        elif raw_risk_score <= 80: new_risk_level = "HIGH"
        else: new_risk_level = "CRITICAL"
        
        ctx["output"] = {"score": raw_risk_score, "level": new_risk_level}
        ctx["decision"] = f"Risk Assessed: {new_risk_level}"
        ctx["confidence"] = 1.0

    # ── Agent 7: Audit Log write ───────────────────────────────────────────────
    async with audit_log_agent.track(db, incident_id, "AuditLogAgent", input_data=None) as ctx:
        ctx["output"]   = {"logs_recorded": True}
        ctx["decision"] = "Pipeline audit complete"
        ctx["confidence"] = 1.0

    # ── Persist Incident ───────────────────────────────────────────────────────
    mitigation_text = "\n".join(mitigation.actions)
    incident = Incident(
        incident_id=incident_id,
        attack_type=reasoning.attack_type,
        protocol=features.protocol_type,
        service=features.service,
        severity=reasoning.severity,
        prediction=detection.prediction,
        confidence=detection.confidence,
        risk_level=new_risk_level,
        threat_reasoning=reasoning.reasoning,
        mitigation_strategy=mitigation_text,
        historical_match=historical.found,
        historical_incident_id=historical.incident_id,
        similarity_score=historical.similarity_score,
        status=report_schema.status,
        raw_features=raw_features,
        report=report_text,
        source=source,
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    # ── Alerting ───────────────────────────────────────────────────────────────
    result = AnalysisResponse(
        incident_id=incident_id,
        detection=detection,
        threat_reasoning=reasoning,
        historical_match=historical,
        mitigation=mitigation,
        report=report_schema,
        db_id=incident.id,
    )
    try:
        await alerting_engine.evaluate(db, result)
        await db.commit()
    except Exception as exc:
        logger.error("Alerting engine error: %s", exc)

    logger.info("Pipeline END  incident=%s  db_id=%d", incident_id, incident.id)
    return result


async def run_batch_pipeline(
    rows: List[Dict[str, Any]],
    db: AsyncSession,
    source: str = "file",
) -> List[AnalysisResponse]:
    results = []
    for row in rows:
        try:
            results.append(await run_pipeline(row, db, source=source))
        except Exception as exc:
            logger.error("Batch pipeline row error: %s", exc)
    return results
