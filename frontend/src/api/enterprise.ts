// Extended API client additions for enterprise features
import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', timeout: 120_000 });

export * from './client';

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  log_id: string;
  incident_id?: string;
  agent_name: string;
  input_data?: unknown;
  output_data?: unknown;
  decision?: string;
  confidence: number;
  execution_time_ms: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  error_message?: string;
}

export interface TimelineStep {
  agent_name: string;
  start_time: string;
  execution_time_ms: number;
  status: string;
  confidence: number;
  decision?: string;
  error_message?: string;
}

export interface ExecutionTimeline {
  incident_id: string;
  steps: TimelineStep[];
  total_time_ms: number;
}

// ─── Explainability ──────────────────────────────────────────────────────────

export interface FeatureImportance {
  feature: string;
  value: number;
  weight: number;
  contribution: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ExplainabilityReport {
  incident_id: string;
  prediction: string;
  confidence: number;
  top_features: FeatureImportance[];
  reasoning_path: string[];
  recommendation_rationale: string;
}

// ─── Playbook ────────────────────────────────────────────────────────────────

export interface PlaybookStep {
  step: number;
  action: string;
  tool: string;
  status: string;
}

export interface Playbook {
  threat: string;
  steps: PlaybookStep[];
  escalation: string;
  kpis: string[];
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface AlertItem {
  id: number;
  alert_id: string;
  incident_id?: string;
  trigger: string;
  message: string;
  severity: string;
  channel: string;
  status: string;
  timestamp: string;
  metadata?: unknown;
}

// ─── Comparisons ─────────────────────────────────────────────────────────────

export interface MitigationComparison {
  comparison_id: string;
  incident_id: string;
  historical_incident_id?: string;
  similarity_score: number;
  historical_mitigation?: string;
  historical_resolution_time?: string;
  historical_success_rate: number;
  recommendation?: string;
  timestamp: string;
}

// ─── Agent performance ───────────────────────────────────────────────────────

export interface AgentPerformanceStat {
  agent_name: string;
  total_calls: number;
  success_rate: number;
  avg_execution_ms: number;
  avg_confidence: number;
  error_count: number;
  p95_execution_ms: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export const fetchAuditLogs = (incident_id?: string, limit = 100) =>
  api.get<AuditLog[]>('/audit-logs', { params: { incident_id, limit } }).then(r => r.data);

export const fetchTimeline = (incident_id: string) =>
  api.get<ExecutionTimeline>(`/audit-logs/timeline/${incident_id}`).then(r => r.data);

export const fetchExplainability = (incident_id: string) =>
  api.get<ExplainabilityReport>(`/explain/${incident_id}`).then(r => r.data);

export const fetchPlaybook = (attack_type: string) =>
  api.get<Playbook>(`/playbooks/${encodeURIComponent(attack_type)}`).then(r => r.data);

export const fetchIncidentPlaybook = (incident_id: string) =>
  api.get<Playbook>(`/incidents/${incident_id}/playbook`).then(r => r.data);

export const fetchAlerts = (status?: string, limit = 50) =>
  api.get<AlertItem[]>('/alerts', { params: { status, limit } }).then(r => r.data);

export const fetchUnreadAlertCount = () =>
  api.get<{ count: number }>('/alerts/unread-count').then(r => r.data);

export const markAlertRead = (alert_id: string) =>
  api.patch(`/alerts/${alert_id}/read`).then(r => r.data);

export const dismissAllAlerts = () =>
  api.patch('/alerts/dismiss-all').then(r => r.data);

export const fetchComparisons = (limit = 50) =>
  api.get<MitigationComparison[]>('/comparisons', { params: { limit } }).then(r => r.data);

export const fetchAgentPerformance = () =>
  api.get<AgentPerformanceStat[]>('/analytics/agents').then(r => r.data);

export const fetchPerformanceTrends = (days = 7) =>
  api.get<{ date: string; agent_name: string; calls: number; avg_ms: number; errors: number }[]>(
    '/analytics/performance-trends', { params: { days } }
  ).then(r => r.data);

export const fetchHeatmapData = () =>
  api.get<{
    hourly_heatmap: { hour: number; dow: number; count: number }[];
    service_frequency: { service: string; count: number }[];
    confidence_by_attack: { attack_type: string; avg_confidence: number; count: number }[];
  }>('/stats/heatmap').then(r => r.data);

export const fetchKnowledgeGraph = () =>
  api.get<{ nodes: { id: string; label: string; type: string; count: number }[]; edges: { source: string; target: string; weight: number }[] }>(
    '/knowledge-graph'
  ).then(r => r.data);

export default api;
