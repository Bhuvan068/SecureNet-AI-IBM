from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# ─── Network Features ────────────────────────────────────────────────────────

class NetworkFeatures(BaseModel):
    duration: float = 0.0
    protocol_type: str = "tcp"
    service: str = "http"
    flag: str = "SF"
    src_bytes: float = 0.0
    dst_bytes: float = 0.0
    land: int = 0
    wrong_fragment: int = 0
    urgent: int = 0
    hot: int = 0
    num_failed_logins: int = 0
    logged_in: int = 0
    num_compromised: int = 0
    root_shell: int = 0
    su_attempted: int = 0
    num_root: int = 0
    num_file_creations: int = 0
    num_shells: int = 0
    num_access_files: int = 0
    num_outbound_cmds: int = 0
    is_host_login: int = 0
    is_guest_login: int = 0
    count: float = 0.0
    srv_count: float = 0.0
    serror_rate: float = 0.0
    srv_serror_rate: float = 0.0
    rerror_rate: float = 0.0
    srv_rerror_rate: float = 0.0
    same_srv_rate: float = 0.0
    diff_srv_rate: float = 0.0
    srv_diff_host_rate: float = 0.0
    dst_host_count: float = 0.0
    dst_host_srv_count: float = 0.0
    dst_host_same_srv_rate: float = 0.0
    dst_host_diff_srv_rate: float = 0.0
    dst_host_same_src_port_rate: float = 0.0
    dst_host_srv_diff_host_rate: float = 0.0
    dst_host_serror_rate: float = 0.0
    dst_host_srv_serror_rate: float = 0.0
    dst_host_rerror_rate: float = 0.0
    dst_host_srv_rerror_rate: float = 0.0

# ─── Detection Schemas ───────────────────────────────────────────────────────

class DetectionRequest(BaseModel):
    features: NetworkFeatures
    source: str = "manual"

class DetectionResult(BaseModel):
    prediction: str
    confidence: float
    risk_level: str

class ThreatReasoning(BaseModel):
    attack_type: str
    indicators: List[str]
    severity: str
    reasoning: str

class HistoricalMatch(BaseModel):
    found: bool
    incident_id: Optional[str] = None
    similarity_score: float = 0.0
    previous_attack: Optional[str] = None
    previous_mitigation: Optional[str] = None
    outcome: Optional[str] = None

class MitigationPlan(BaseModel):
    actions: List[str]
    priority: str
    estimated_severity: str

class IncidentReport(BaseModel):
    incident_id: str
    timestamp: str
    prediction: str
    confidence: float
    attack_type: str
    severity: str
    historical_match: bool
    similarity_score: float
    previous_solution: Optional[str]
    recommendation: str
    status: str

# ─── Full Analysis Response ──────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    incident_id: str
    detection: DetectionResult
    threat_reasoning: ThreatReasoning
    historical_match: HistoricalMatch
    mitigation: MitigationPlan
    report: IncidentReport
    db_id: Optional[int] = None

# ─── Incident CRUD ───────────────────────────────────────────────────────────

class IncidentOut(BaseModel):
    id: int
    incident_id: str
    timestamp: datetime
    attack_type: str
    protocol: Optional[str]
    service: Optional[str]
    severity: str
    prediction: str
    confidence: float
    risk_level: str
    mitigation_strategy: Optional[str]
    historical_match: bool
    similarity_score: float
    status: str
    source: str

    class Config:
        from_attributes = True

class IncidentListResponse(BaseModel):
    total: int
    items: List[IncidentOut]

# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    incident_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    incident_id: Optional[str] = None

# ─── Stats ───────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_events: int
    normal_traffic: int
    anomalies: int
    critical_threats: int
    resolved_incidents: int

class AttackTrend(BaseModel):
    date: str
    anomalies: int
    normal: int

class ProtocolDistribution(BaseModel):
    protocol: str
    count: int

class SeverityDistribution(BaseModel):
    severity: str
    count: int


# ─── Feature 1: Audit Log ────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    log_id: str
    incident_id: Optional[str]
    agent_name: str
    input_data: Optional[Any]
    output_data: Optional[Any]
    decision: Optional[str]
    confidence: float
    execution_time_ms: float
    timestamp: datetime
    status: str
    error_message: Optional[str]

    class Config:
        from_attributes = True

# ─── Feature 2: Execution Timeline ───────────────────────────────────────────

class TimelineStep(BaseModel):
    agent_name: str
    start_time: str
    execution_time_ms: float
    status: str
    confidence: float
    decision: Optional[str]
    error_message: Optional[str]

class ExecutionTimeline(BaseModel):
    incident_id: str
    steps: List[TimelineStep]
    total_time_ms: float

# ─── Feature 4: Mitigation Comparison ────────────────────────────────────────

class MitigationComparisonOut(BaseModel):
    comparison_id: str
    incident_id: str
    historical_incident_id: Optional[str]
    similarity_score: float
    historical_mitigation: Optional[str]
    historical_resolution_time: Optional[str]
    historical_success_rate: float
    recommendation: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# ─── Feature 6: Explainability ────────────────────────────────────────────────

class FeatureImportance(BaseModel):
    feature: str
    value: float
    weight: float
    contribution: str   # "HIGH" | "MEDIUM" | "LOW"

class ExplainabilityReport(BaseModel):
    incident_id: str
    prediction: str
    confidence: float
    top_features: List[FeatureImportance]
    reasoning_path: List[str]
    recommendation_rationale: str

# ─── Feature 7: Playbook ─────────────────────────────────────────────────────

class PlaybookStep(BaseModel):
    step: int
    action: str
    tool: str
    status: str

class PlaybookOut(BaseModel):
    threat: str
    steps: List[PlaybookStep]
    escalation: str
    kpis: List[str]

# ─── Feature 9: Alerts ───────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    alert_id: str
    incident_id: Optional[str]
    trigger: str
    message: str
    severity: str
    channel: str
    status: str
    timestamp: datetime
    metadata: Optional[Any]

    class Config:
        from_attributes = True

# ─── Feature 10: Agent Performance ───────────────────────────────────────────

class AgentPerformanceStat(BaseModel):
    agent_name: str
    total_calls: int
    success_rate: float
    avg_execution_ms: float
    avg_confidence: float
    error_count: int
    p95_execution_ms: float

# ─── Analysis Response with timeline ─────────────────────────────────────────

class AnalysisResponseV2(AnalysisResponse):
    timeline: Optional[ExecutionTimeline] = None
    alerts_fired: Optional[List[Dict[str, Any]]] = None

# --- Feature 29: Agent Analytics ---------------------------------------------

class AgentMetricOut(BaseModel):
    agent_name: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    failure_rate: float
    avg_response_time_ms: float
    median_response_time_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    avg_confidence: float
    max_confidence: float
    min_confidence: float
    daily_count: int
    weekly_count: int
    monthly_count: int

class AgentTrendPoint(BaseModel):
    timestamp: str
    agent_name: str
    value: float

class AgentErrorAnalysis(BaseModel):
    error_message: str
    count: int
    frequency: float

class AgentThroughputPoint(BaseModel):
    timestamp: str
    requests_per_minute: int

class AgentAnalyticsResponse(BaseModel):
    metrics: List[AgentMetricOut]
    trends: List[AgentTrendPoint]
    errors: List[AgentErrorAnalysis]
    throughput: List[AgentThroughputPoint]
    relationship_graph: List[Dict[str, Any]]
