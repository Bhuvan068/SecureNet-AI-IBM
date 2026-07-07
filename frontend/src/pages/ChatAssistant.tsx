import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, IconButton,
  Divider, Alert, CircularProgress, Tabs, Tab, Tooltip,
  Chip, LinearProgress, useTheme,
} from '@mui/material';
import {
  Send as SendIcon, Upload as UploadIcon,
  Refresh as ResetIcon, CheckCircle, Warning, BugReport,
  Menu as MenuIcon, Add as AddIcon, Delete as DeleteIcon,
  Download as DownloadIcon, PushPin as PinIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import {
  analyseFeatures, uploadFile, pollUploadStatus,
  sendChat, fetchChats, fetchChatMessages,
  updateChat, deleteChat, clearAllChats,
  type NetworkFeatures, type AnalysisResponse
} from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import AgentTimeline from '../components/AgentTimeline';
import WorkflowGraph from '../components/WorkflowGraph';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import PlaybookPanel from '../components/PlaybookPanel';

// ─── Feature definitions ──────────────────────────────────────────────────────

const FEATURE_GROUPS = [
  {
    group: 'Basic Connection',
    fields: [
      { key: 'duration', label: 'Duration', type: 'number', default: 0 },
      { key: 'protocol_type', label: 'Protocol', type: 'text', default: 'tcp' },
      { key: 'service', label: 'Service', type: 'text', default: 'http' },
      { key: 'flag', label: 'Flag', type: 'text', default: 'SF' },
      { key: 'src_bytes', label: 'Src Bytes', type: 'number', default: 0 },
      { key: 'dst_bytes', label: 'Dst Bytes', type: 'number', default: 0 },
      { key: 'land', label: 'Land', type: 'number', default: 0 },
      { key: 'wrong_fragment', label: 'Wrong Fragment', type: 'number', default: 0 },
      { key: 'urgent', label: 'Urgent', type: 'number', default: 0 },
    ],
  },
  {
    group: 'Content Features',
    fields: [
      { key: 'hot', label: 'Hot', type: 'number', default: 0 },
      { key: 'num_failed_logins', label: 'Failed Logins', type: 'number', default: 0 },
      { key: 'logged_in', label: 'Logged In', type: 'number', default: 0 },
      { key: 'num_compromised', label: 'Num Compromised', type: 'number', default: 0 },
      { key: 'root_shell', label: 'Root Shell', type: 'number', default: 0 },
      { key: 'su_attempted', label: 'SU Attempted', type: 'number', default: 0 },
      { key: 'num_root', label: 'Num Root', type: 'number', default: 0 },
      { key: 'num_file_creations', label: 'File Creations', type: 'number', default: 0 },
      { key: 'num_shells', label: 'Num Shells', type: 'number', default: 0 },
      { key: 'num_access_files', label: 'Access Files', type: 'number', default: 0 },
      { key: 'num_outbound_cmds', label: 'Outbound Cmds', type: 'number', default: 0 },
      { key: 'is_host_login', label: 'Is Host Login', type: 'number', default: 0 },
      { key: 'is_guest_login', label: 'Is Guest Login', type: 'number', default: 0 },
    ],
  },
  {
    group: 'Traffic Features',
    fields: [
      { key: 'count', label: 'Count', type: 'number', default: 0 },
      { key: 'srv_count', label: 'Srv Count', type: 'number', default: 0 },
      { key: 'serror_rate', label: 'Serror Rate', type: 'number', default: 0 },
      { key: 'srv_serror_rate', label: 'Srv Serror', type: 'number', default: 0 },
      { key: 'rerror_rate', label: 'Rerror Rate', type: 'number', default: 0 },
      { key: 'srv_rerror_rate', label: 'Srv Rerror', type: 'number', default: 0 },
      { key: 'same_srv_rate', label: 'Same Srv Rate', type: 'number', default: 0 },
      { key: 'diff_srv_rate', label: 'Diff Srv Rate', type: 'number', default: 0 },
      { key: 'srv_diff_host_rate', label: 'Srv Diff Host', type: 'number', default: 0 },
    ],
  },
  {
    group: 'Destination Host Features',
    fields: [
      { key: 'dst_host_count', label: 'Dst Host Count', type: 'number', default: 0 },
      { key: 'dst_host_srv_count', label: 'Dst Srv Count', type: 'number', default: 0 },
      { key: 'dst_host_same_srv_rate', label: 'Same Srv Rate', type: 'number', default: 0 },
      { key: 'dst_host_diff_srv_rate', label: 'Diff Srv Rate', type: 'number', default: 0 },
      { key: 'dst_host_same_src_port_rate', label: 'Same Src Port Rate', type: 'number', default: 0 },
      { key: 'dst_host_srv_diff_host_rate', label: 'Srv Diff Host Rate', type: 'number', default: 0 },
      { key: 'dst_host_serror_rate', label: 'Dst Serror Rate', type: 'number', default: 0 },
      { key: 'dst_host_srv_serror_rate', label: 'Dst Srv Serror Rate', type: 'number', default: 0 },
      { key: 'dst_host_rerror_rate', label: 'Dst Rerror Rate', type: 'number', default: 0 },
      { key: 'dst_host_srv_rerror_rate', label: 'Dst Srv Rerror Rate', type: 'number', default: 0 },
    ],
  },
];

const EMPTY_ROW = (): NetworkFeatures => {
  const r: NetworkFeatures = {};
  FEATURE_GROUPS.forEach(g => g.fields.forEach(f => { r[f.key] = f.default as string | number; }));
  return r;
};

// ─── Prebuilt attack samples ──────────────────────────────────────────────────

const SAMPLES: Record<string, Partial<NetworkFeatures>> = {
  'DoS Attack': { duration: 0, protocol_type: 'tcp', service: 'http', flag: 'S0', src_bytes: 80000, dst_bytes: 0, count: 511, srv_count: 511, serror_rate: 1.0, srv_serror_rate: 1.0, dst_host_count: 255, dst_host_srv_count: 255 },
  'R2L Attack': { duration: 2, protocol_type: 'tcp', service: 'ftp', flag: 'SF', src_bytes: 230, dst_bytes: 354, num_failed_logins: 5, logged_in: 0 },
  'U2R Attack': { duration: 0, protocol_type: 'tcp', service: 'telnet', flag: 'SF', src_bytes: 1500, dst_bytes: 5400, logged_in: 1, root_shell: 1, num_shells: 2, su_attempted: 1 },
  'Port Scan': { duration: 0, protocol_type: 'tcp', service: 'private', flag: 'REJ', src_bytes: 0, dst_bytes: 0, serror_rate: 0.9, count: 300, diff_srv_rate: 0.9 },
  'Normal Traffic': { duration: 0, protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 232, dst_bytes: 8153, logged_in: 1, count: 5, srv_count: 5, same_srv_rate: 1.0 },
};

// ─── Result Panel ─────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: AnalysisResponse }) {
  const theme = useTheme();
  const isAnomaly = result.detection.prediction === 'ANOMALY';

  return (
    <Box sx={{ mt: 2 }}>
      <Alert
        severity={isAnomaly ? 'error' : 'success'}
        icon={isAnomaly ? <BugReport /> : <CheckCircle />}
        sx={{ mb: 2, fontWeight: 600 }}
      >
        {result.detection.prediction} — Confidence: {result.detection.confidence.toFixed(1)}% — Risk: {result.detection.risk_level}
      </Alert>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>THREAT ANALYSIS</Typography>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.5 }}>{result.threat_reasoning.attack_type}</Typography>
            <SeverityBadge level={result.threat_reasoning.severity} />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">Indicators:</Typography>
            {result.threat_reasoning.indicators.map((ind, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', pl: 1, '&::before': { content: '"• "' } }}>{ind}</Typography>
            ))}
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {result.threat_reasoning.reasoning}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>HISTORICAL MATCH</Typography>
            <Box sx={{ mt: 0.5 }}>
              {result.historical_match.found ? (
                <>
                  <Typography variant="caption" color="success.main" fontWeight={700}>✓ MATCH FOUND</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>ID: {result.historical_match.incident_id}</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>Similarity: {result.historical_match.similarity_score.toFixed(1)}%</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>Attack: {result.historical_match.previous_attack}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                    {result.historical_match.previous_mitigation?.split('\n')[0]}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">No historical match (similarity: {result.historical_match.similarity_score.toFixed(1)}%)</Typography>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>MITIGATION — {result.mitigation.priority}</Typography>
            {result.mitigation.actions.slice(0, 5).map((action, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', mt: 0.4 }}>{i + 1}. {action}</Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: 1.5,
          bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
          border: '1px solid', borderColor: 'divider',
          fontFamily: 'monospace', fontSize: 11,
          maxHeight: 200, overflowY: 'auto',
        }}
      >
        <Typography variant="caption" color="primary.main" fontWeight={700}>INCIDENT ID: {result.incident_id}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
          Prediction: {result.report.prediction} ({result.report.confidence.toFixed(1)}%)  |  Severity: {result.report.severity}  |  Status: {result.report.status}
          {'\n'}Recommendation: {result.report.recommendation}
        </Typography>
      </Paper>

      {/* Enterprise panels — Timeline, Workflow, Explainability, Playbook */}
      <EnterpriseResultPanels incidentId={result.incident_id} />
    </Box>
  );
}

// ─── Enterprise panels shown below each result ────────────────────────────────
function EnterpriseResultPanels({ incidentId }: { incidentId: string }) {
  const [epTab, setEpTab] = useState(0);
  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={epTab} onChange={(_, v) => setEpTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Tab label="Agent Timeline" sx={{ fontSize: 11 }} />
        <Tab label="Workflow" sx={{ fontSize: 11 }} />
        <Tab label="XAI Explain" sx={{ fontSize: 11 }} />
        <Tab label="Playbook" sx={{ fontSize: 11 }} />
      </Tabs>
      {epTab === 0 && <AgentTimeline incidentId={incidentId} />}
      {epTab === 1 && <WorkflowGraph />}
      {epTab === 2 && <ExplainabilityPanel incidentId={incidentId} />}
      {epTab === 3 && <PlaybookPanel incidentId={incidentId} />}
    </Box>
  );
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatAssistant() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<NetworkFeatures[]>([EMPTY_ROW()]);
  const [analysing, setAnalysing] = useState(false);
  const [results, setResults] = useState<AnalysisResponse[]>([]);
  const [analyseError, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResults, setUploadResults] = useState<AnalysisResponse[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hello! I am your SecureNet AI SOC assistant. How can I help you today?\n\nYou can ask me to explain anomalies, suggest mitigations, compare historical incidents, or generate reports.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [lastIncidentId, setLastIncidentId] = useState<string | undefined>();
  const [currentConvId, setCurrentConvId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSample, setSelectedSample] = useState('');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await fetchChats();
      setConversations(convs);
    } catch { }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadChat = async (convId: string) => {
    try {
      const msgs = await fetchChatMessages(convId);
      setMessages([
        { role: 'assistant', content: 'Hello! I am your SecureNet AI SOC assistant. How can I help you today?' },
        ...msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ]);
      setCurrentConvId(convId);
      setShowHistory(false);
    } catch { }
  };

  const startNewChat = () => {
    setCurrentConvId(undefined);
    setMessages([{ role: 'assistant', content: 'Hello! I am your SecureNet AI SOC assistant. How can I help you today?' }]);
    setShowHistory(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${currentConvId || 'new'}.json`;
    a.click();
  };

  const handleDeleteCurrent = async () => {
    if (currentConvId) {
      await deleteChat(currentConvId);
      await loadConversations();
    }
    startNewChat();
  };

  const handleClearAll = async () => {
    await clearAllChats();
    await loadConversations();
    startNewChat();
    // Also clear analysis history/files per requirement
    setResults([]);
    setUploadResults([]);
  };

  const updateRow = (rowIdx: number, field: string, value: string | number) => {
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
  const deleteRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));
  const resetRows = () => setRows([EMPTY_ROW()]);

  const loadSample = (name: string) => {
    const sample = SAMPLES[name];
    if (!sample) return;
    setRows([{ ...EMPTY_ROW(), ...sample }]);
    setSelectedSample(name);
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    setError('');
    setResults([]);
    try {
      const res = await Promise.all(rows.map(r => analyseFeatures(r)));
      setResults(res);
      if (res[0]) setLastIncidentId(res[0].incident_id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setError(msg);
    } finally {
      setAnalysing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadResults([]);
    setUploadProgress(0);
    setUploadTotal(0);
    setUploadStatus('Uploading...');
    try {
      const res = await uploadFile(file) as unknown as { task_id: string }; // Type assert since backend changed
      const taskId = res.task_id;

      // Poll
      const interval = setInterval(async () => {
        try {
          const statusRes = await pollUploadStatus(taskId);
          setUploadProgress(statusRes.progress);
          setUploadTotal(statusRes.total);

          if (statusRes.status === 'completed') {
            clearInterval(interval);
            setUploadResults(statusRes.results || []);
            setUploadStatus('Completed');
            if (statusRes.results?.[0]) setLastIncidentId(statusRes.results[0].incident_id);
            setTimeout(() => setUploadLoading(false), 1000); // Hide after a bit
          } else if (statusRes.status === 'failed') {
            clearInterval(interval);
            setUploadStatus('Failed: ' + (statusRes.error || 'Unknown error'));
            setUploadLoading(false);
          } else {
            setUploadStatus(`Processing chunk ${statusRes.progress}...`);
          }
        } catch {
          clearInterval(interval);
          setUploadStatus('Failed to poll status');
          setUploadLoading(false);
        }
      }, 1000);

    } catch {
      setUploadResults([]);
      setUploadStatus('Upload failed');
      setUploadLoading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await sendChat(userMsg, lastIncidentId, undefined, currentConvId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
      if (res.conversation_id && !currentConvId) {
        setCurrentConvId(res.conversation_id);
        loadConversations();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Chat Assistant</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
        Manual intrusion analysis, file upload, and AI-powered SOC chat
      </Typography>

      <Grid container spacing={2}>
        {/* Left: Input / Upload */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
              <Tab label="Manual Input" />
              <Tab label="File Upload" />
            </Tabs>

            {/* ── Manual Tab ── */}
            {tab === 0 && (
              <Box sx={{ p: 2 }}>
                {/* Sample presets */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>Presets:</Typography>
                  {Object.keys(SAMPLES).map(name => (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      variant={selectedSample === name ? 'filled' : 'outlined'}
                      color={name.includes('Normal') ? 'success' : 'warning'}
                      onClick={() => loadSample(name)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>

                {/* Feature table */}
                <Box sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {FEATURE_GROUPS.map((group) => (
                    <Box key={group.group}>
                      <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'action.hover' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">
                          {group.group}
                        </Typography>
                      </Box>
                      <Grid container sx={{ px: 1 }}>
                        {group.fields.map((field) => (
                          <Grid item xs={6} sm={4} md={3} key={field.key} sx={{ p: 0.5 }}>
                            <TextField
                              label={field.label}
                              size="small"
                              fullWidth
                              value={rows[0]?.[field.key] ?? field.default}
                              onChange={(e) => updateRow(0, field.key, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                              inputProps={{ style: { fontSize: 12 } }}
                              InputLabelProps={{ style: { fontSize: 11 } }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={analysing ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    onClick={handleAnalyse}
                    disabled={analysing}
                  >
                    Analyse Traffic
                  </Button>
                  <Button variant="outlined" startIcon={<ResetIcon />} onClick={resetRows} size="small">Reset</Button>
                </Box>

                {analyseError && <Alert severity="error" sx={{ mt: 2 }}>{analyseError}</Alert>}
                {results.map((r, i) => <ResultPanel key={i} result={r} />)}
              </Box>
            )}

            {/* ── File Upload Tab ── */}
            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: uploadLoading ? 'primary.main' : 'divider',
                    borderRadius: 2, p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>Click to upload or drag and drop</Typography>
                  <Typography variant="caption" color="text.secondary">CSV, Excel (.xlsx), JSON, TXT, LOG, PDF</Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls,.json,.txt,.log,.pdf"
                    onChange={handleFileUpload}
                  />
                </Box>

                {uploadLoading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant={uploadTotal > 0 ? "determinate" : "indeterminate"} value={uploadTotal > 0 ? (uploadProgress / uploadTotal) * 100 : 0} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{uploadStatus}</span>
                      {uploadTotal > 0 && <span>{uploadProgress} / {uploadTotal}</span>}
                    </Typography>
                  </Box>
                )}

                {uploadResults.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Processed {uploadResults.length} records.{' '}
                      Anomalies: {uploadResults.filter(r => r.detection.prediction === 'ANOMALY').length}
                    </Alert>
                    {uploadResults.slice(0, 3).map((r, i) => <ResultPanel key={i} result={r} />)}
                    {uploadResults.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{uploadResults.length - 3} more results. Check the Dashboard for all incidents.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Chat */}
        <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              border: '1px solid', borderColor: 'divider',
              display: 'flex', flexDirection: 'column',
              height: { xs: 500, lg: 'calc(100vh - 160px)' },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>AI Security Chat Assistant</Typography>
                <Typography variant="caption" color="text.secondary">Powered by IBM Granite</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="History">
                  <IconButton size="small" onClick={() => setShowHistory(!showHistory)}><MenuIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="New Chat">
                  <IconButton size="small" onClick={startNewChat}><AddIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Export Chat">
                  <IconButton size="small" onClick={handleExport}><DownloadIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete Chat / Files">
                  <IconButton size="small" color="error" onClick={handleDeleteCurrent}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Clear All Chats & History">
                  <Button size="small" color="error" variant="outlined" onClick={handleClearAll} sx={{ fontSize: 10, minWidth: 0, px: 1 }}>Clear All</Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Main Chat Area or History Sidebar */}
            {showHistory ? (
              <Box sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                {conversations.map(c => (
                  <Box
                    key={c.id}
                    onClick={() => loadChat(c.conversation_id)}
                    sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, bgcolor: currentConvId === c.conversation_id ? 'action.selected' : 'transparent' }}
                  >
                    <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(c.updated_at).toLocaleString()}</Typography>
                  </Box>
                ))}
                {conversations.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No conversations yet.</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <>
                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {messages.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '88%', p: 1.5, borderRadius: 2,
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'action.hover',
                          color: msg.role === 'user' ? '#fff' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {chatLoading && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CircularProgress size={14} />
                      <Typography variant="caption" color="text.secondary">Thinking…</Typography>
                    </Box>
                  )}
                  <div ref={chatEndRef} />
                </Box>

                {/* Quick prompts */}
                <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {[
                    'Explain this anomaly',
                    'What mitigation should I apply?',
                    'Show similar attacks',
                    'Generate incident report',
                  ].map(prompt => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      size="small"
                      variant="outlined"
                      onClick={() => { setChatInput(prompt); }}
                      sx={{ cursor: 'pointer', fontSize: 10 }}
                    />
                  ))}
                </Box>

                <Divider />

                {/* Input */}
                <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    multiline
                    maxRows={3}
                    fullWidth
                    size="small"
                    placeholder="Ask about threats, mitigations, incidents…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleChat();
                        }
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
