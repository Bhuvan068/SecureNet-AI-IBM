# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(String(60), index=True, nullable=True) # Added in Phase 4
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    attack_type = Column(String(100), nullable=False, default="Unknown")
    protocol = Column(String(50), nullable=True)
    service = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=False, default="LOW")
    prediction = Column(String(20), nullable=False, default="NORMAL")
    confidence = Column(Float, default=0.0)
    risk_level = Column(String(20), default="LOW")
    threat_reasoning = Column(Text, nullable=True)
    mitigation_strategy = Column(Text, nullable=True)
    historical_match = Column(Boolean, default=False)
    historical_incident_id = Column(String(50), nullable=True)
    similarity_score = Column(Float, default=0.0)
    status = Column(String(30), default="OPEN")
    resolution_time = Column(String(50), nullable=True)
    raw_features = Column(JSON, nullable=True)
    report = Column(Text, nullable=True)
    source = Column(String(20), default="manual")


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), default="New Conversation")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(50), index=True, nullable=True) # References ChatConversation.conversation_id
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    incident_id = Column(String(50), nullable=True)


class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    incident_id = Column(String(50), nullable=True)
    agent_name = Column(String(50), nullable=False)
    decision = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)

    # FIXED: metadata -> extra_data
    extra_data = Column(JSON, nullable=True)


# ─── Feature 1: Audit Log ────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=True)
    agent_name = Column(String(60), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    decision = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    execution_time_ms = Column(Float, default=0.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="SUCCESS")
    error_message = Column(Text, nullable=True)


# ─── Feature 4: Mitigation Comparison ───────────────────────────────────────

class MitigationComparison(Base):
    __tablename__ = "mitigation_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    comparison_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    historical_incident_id = Column(String(50), nullable=True)
    similarity_score = Column(Float, default=0.0)
    historical_mitigation = Column(Text, nullable=True)
    historical_resolution_time = Column(String(50), nullable=True)
    historical_success_rate = Column(Float, default=0.0)
    recommendation = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ─── Feature 9: Alerts ──────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), nullable=True)
    trigger = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH")
    channel = Column(String(20), default="dashboard")
    status = Column(String(20), default="UNREAD")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # FIXED: metadata -> extra_data
    extra_data = Column(JSON, nullable=True)


# ─── Feature 11: Threat Intelligence ────────────────────────────────────────

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), index=True, nullable=False)
    attack_type = Column(String(100), nullable=False)
    mitre_technique = Column(String(50), nullable=True)
    cwe_id = Column(String(50), nullable=True)
    cve_references = Column(JSON, nullable=True)
    iocs = Column(JSON, nullable=True)
    reputation_score = Column(Float, default=0.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ─── Feature 12: Digital Forensics ──────────────────────────────────────────

class ForensicRecord(Base):
    __tablename__ = "forensic_records"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    evidence_metadata = Column(JSON, nullable=True)
    packet_snapshot = Column(JSON, nullable=True)
    sha256_fingerprint = Column(String(64), nullable=True)
    timeline = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ─── Feature 15: Model Drift ────────────────────────────────────────────────

class ModelDrift(Base):
    __tablename__ = "model_drift"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    historical_normal_pct = Column(Float, nullable=False)
    current_normal_pct = Column(Float, nullable=False)
    drift_detected = Column(Boolean, default=False)
    severity = Column(String(20), default="LOW")


# ─── Feature 20: SOC Case Management ────────────────────────────────────────

class SOCCase(Base):
    __tablename__ = "soc_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    analyst = Column(String(100), nullable=True)
    priority = Column(String(20), default="MEDIUM")
    status = Column(String(30), default="New")
    notes = Column(Text, nullable=True)
    actions = Column(JSON, nullable=True)
    attachments = Column(JSON, nullable=True)
    resolution = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    closed_date = Column(DateTime(timezone=True), nullable=True)


# ─── Phase 2: Notification History & Live Events ────────────────────────────

class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=True)
    type = Column(String(50), nullable=False)
    recipient = Column(String(100), nullable=False)
    status = Column(String(30), default="SENT")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class LiveEvent(Base):
    __tablename__ = "live_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(60), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    protocol = Column(String(50), nullable=True)
    service = Column(String(50), nullable=True)
    prediction = Column(String(50), nullable=True)
    severity = Column(String(50), nullable=True)
    confidence = Column(Float, default=0.0)
    source = Column(String(50), default="live")
    status = Column(String(50), default="PROCESSED")


# ─── Phase 3: Executive Summary, Timeline, Impact, Demo ─────────────────────

class ExecutiveReport(Base):
    __tablename__ = "executive_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    summary = Column(Text, nullable=True)
    business_impact = Column(Text, nullable=True)
    recovery_estimate = Column(String(50), nullable=True)
    risk_score = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AttackTimeline(Base):
    __tablename__ = "attack_timelines"

    id = Column(Integer, primary_key=True, index=True)
    timeline_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    agent_name = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)
    decision = Column(Text, nullable=True)


class ImpactPrediction(Base):
    __tablename__ = "impact_predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    predicted_downtime = Column(String(50), nullable=True)
    predicted_risk = Column(Float, nullable=True)
    predicted_services = Column(Integer, nullable=True)
    predicted_severity = Column(String(50), nullable=True)
    predicted_recovery = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DemoRun(Base):
    __tablename__ = "demo_runs"

    id = Column(Integer, primary_key=True, index=True)
    demo_id = Column(String(60), unique=True, index=True, nullable=False)
    scenario = Column(String(100), nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    risk_score = Column(Float, nullable=True)
    historical_match = Column(Float, nullable=True)
    execution_time = Column(Float, nullable=True)
    status = Column(String(50), default="COMPLETED")


# ─── Phase 4: Organization, XAI, Digital Twin ───────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(String(60), unique=True, index=True, nullable=False)
    organization_name = Column(String(100), nullable=False)
    organization_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class XAIReport(Base):
    __tablename__ = "xai_reports"

    id = Column(Integer, primary_key=True, index=True)
    xai_id = Column(String(60), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=False)
    prediction = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    top_features = Column(JSON, nullable=True)
    feature_scores = Column(JSON, nullable=True)
    decision_path = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    historical_similarity = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DigitalAsset(Base):
    __tablename__ = "digital_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(60), unique=True, index=True, nullable=False)
    organization_id = Column(String(60), index=True, nullable=False)
    asset_name = Column(String(100), nullable=False)
    asset_type = Column(String(50), nullable=False)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(20), default="Safe")
    risk_score = Column(Float, default=0.0)
    location = Column(String(100), nullable=True)
# --- Feature 29: Agent Performance Analytics ----------------------------------

class AgentPerformanceMetric(Base):
    __tablename__ = "agent_performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(String(60), unique=True, index=True, nullable=False)
    agent_name = Column(String(100), index=True, nullable=False)
    incident_id = Column(String(50), index=True, nullable=True)
    organization_id = Column(String(60), index=True, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
