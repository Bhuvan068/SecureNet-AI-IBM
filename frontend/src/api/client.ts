import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120_000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NetworkFeatures {
  duration?: number; protocol_type?: string; service?: string; flag?: string;
  src_bytes?: number; dst_bytes?: number; land?: number; wrong_fragment?: number;
  urgent?: number; hot?: number; num_failed_logins?: number; logged_in?: number;
  num_compromised?: number; root_shell?: number; su_attempted?: number;
  num_root?: number; num_file_creations?: number; num_shells?: number;
  num_access_files?: number; num_outbound_cmds?: number; is_host_login?: number;
  is_guest_login?: number; count?: number; srv_count?: number;
  serror_rate?: number; srv_serror_rate?: number; rerror_rate?: number;
  srv_rerror_rate?: number; same_srv_rate?: number; diff_srv_rate?: number;
  srv_diff_host_rate?: number; dst_host_count?: number; dst_host_srv_count?: number;
  dst_host_same_srv_rate?: number; dst_host_diff_srv_rate?: number;
  dst_host_same_src_port_rate?: number; dst_host_srv_diff_host_rate?: number;
  dst_host_serror_rate?: number; dst_host_srv_serror_rate?: number;
  dst_host_rerror_rate?: number; dst_host_srv_rerror_rate?: number;
  [key: string]: string | number | undefined;
}

export interface DetectionResult {
  prediction: 'NORMAL' | 'ANOMALY';
  confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ThreatReasoning {
  attack_type: string;
  indicators: string[];
  severity: string;
  reasoning: string;
}

export interface HistoricalMatch {
  found: boolean;
  incident_id?: string;
  similarity_score: number;
  previous_attack?: string;
  previous_mitigation?: string;
  outcome?: string;
}

export interface MitigationPlan {
  actions: string[];
  priority: string;
  estimated_severity: string;
}

export interface IncidentReport {
  incident_id: string;
  timestamp: string;
  prediction: string;
  confidence: number;
  attack_type: string;
  severity: string;
  historical_match: boolean;
  similarity_score: number;
  previous_solution?: string;
  recommendation: string;
  status: string;
}

export interface AnalysisResponse {
  incident_id: string;
  detection: DetectionResult;
  threat_reasoning: ThreatReasoning;
  historical_match: HistoricalMatch;
  mitigation: MitigationPlan;
  report: IncidentReport;
  db_id?: number;
}

export interface Incident {
  id: number;
  incident_id: string;
  timestamp: string;
  attack_type: string;
  protocol?: string;
  service?: string;
  severity: string;
  prediction: string;
  confidence: number;
  risk_level: string;
  mitigation_strategy?: string;
  historical_match: boolean;
  similarity_score: number;
  status: string;
  source: string;
}

export interface DashboardStats {
  total_events: number;
  normal_traffic: number;
  anomalies: number;
  critical_threats: number;
  resolved_incidents: number;
}

export interface AttackTrend {
  date: string;
  anomalies: number;
  normal: number;
}

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
  extra_data?: any;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const analyseFeatures = (features: NetworkFeatures, source = 'manual') =>
  api.post<AnalysisResponse>('/analyse', { features, source }).then(r => r.data);

export const uploadFile = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post<{ task_id: string }>('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export interface UploadStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  results?: AnalysisResponse[];
  error?: string;
}

export const pollUploadStatus = (taskId: string) =>
  api.get<UploadStatus>(`/upload/status/${taskId}`).then(r => r.data);

export const fetchStats = () =>
  api.get<DashboardStats>('/stats').then(r => r.data);

export const fetchTrends = (days = 7) =>
  api.get<AttackTrend[]>('/stats/trends', { params: { days } }).then(r => r.data);

export const fetchProtocols = () =>
  api.get<{ protocol: string; count: number }[]>('/stats/protocols').then(r => r.data);

export const fetchSeverity = () =>
  api.get<{ severity: string; count: number }[]>('/stats/severity').then(r => r.data);

export const fetchIncidents = (skip = 0, limit = 50) =>
  api.get<{ total: number; items: Incident[] }>('/incidents', { params: { skip, limit } }).then(r => r.data);

export const fetchIncident = (id: string) =>
  api.get<Incident>(`/incidents/${id}`).then(r => r.data);

export const fetchReport = (id: string) =>
  api.get<{ incident_id: string; report: string }>(`/incidents/${id}/report`).then(r => r.data);

export const updateStatus = (id: string, status: string) => {
  const fd = new FormData();
  fd.append('status', status);
  return api.patch(`/incidents/${id}/status`, fd).then(r => r.data);
};

export const updateAlertStatus = (id: string, status: string) =>
  api.patch(`/alerts/${id}/status`, { status }).then(r => r.data);

export const markAlertRead = (id: string) =>
  api.patch(`/alerts/${id}/read`).then(r => r.data);

export const fetchAlerts = (status?: string, severity?: string, sort_by: string = 'timestamp_desc') =>
  api.get('/alerts', { params: { status, severity, sort_by } }).then(r => r.data);

export const sendChat = (message: string, incident_id?: string, context?: Record<string, unknown>, conversation_id?: string) =>
  api.post<{ response: string; conversation_id?: string }>('/chat', { message, incident_id, context, conversation_id }).then(r => r.data);

export const fetchChats = () =>
  api.get<{ id: number; conversation_id: string; title: string; is_pinned: boolean; updated_at: string }[]>('/chats').then(r => r.data);

export const fetchChatMessages = (conversation_id: string) =>
  api.get<{ id: number; role: string; content: string; timestamp: string }[]>(`/chats/${conversation_id}/messages`).then(r => r.data);

export const updateChat = (conversation_id: string, title?: string, is_pinned?: boolean) =>
  api.patch(`/chats/${conversation_id}`, { title, is_pinned }).then(r => r.data);

export const deleteChat = (conversation_id: string) =>
  api.delete(`/chats/${conversation_id}`).then(r => r.data);

export const clearAllChats = () =>
  api.delete('/chats').then(r => r.data);

export default api;
