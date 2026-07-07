import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Paper, Tabs, Tab, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, CircularProgress, Divider, useTheme,
} from '@mui/material';
import { Refresh as RefreshIcon, TrendingUp, Security, BugReport, CheckCircle, Warning } from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import {
  fetchStats, fetchTrends, fetchProtocols, fetchSeverity, fetchIncidents,
  type DashboardStats, type AttackTrend, type Incident,
} from '../api/client';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import ThreatHeatmap from '../components/ThreatHeatmap';
import AgentAnalytics from '../components/AgentAnalytics';
import AlertCenter from '../components/AlertCenter';
import KnowledgeGraph from '../components/KnowledgeGraph';

const COLORS = ['#3b82d4', '#f85149', '#d29922', '#3fb950', '#7c5cd8', '#58a6ff'];

function LiveLog({ incidents }: { incidents: Incident[] }) {
  const theme = useTheme();
  const recent = incidents.slice(0, 25);
  return (
    <Box
      sx={{
        maxHeight: 240, overflowY: 'auto',
        bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
        borderRadius: 1, p: 1.5, fontFamily: 'monospace', fontSize: 11,
      }}
    >
      {recent.length === 0 && <Typography variant="caption" color="text.secondary">No events yet.</Typography>}
      {recent.map((inc) => (
        <Box key={inc.id} sx={{ display: 'flex', gap: 1, mb: 0.4, alignItems: 'center' }}>
          <Typography component="span" sx={{ color: inc.prediction === 'ANOMALY' ? 'error.main' : 'success.main', fontSize: 10 }}>
            {inc.prediction === 'ANOMALY' ? '⚠' : '✓'}
          </Typography>
          <Typography component="span" color="text.secondary" sx={{ fontSize: 10 }}>
            {new Date(inc.timestamp).toLocaleTimeString()}
          </Typography>
          <Typography component="span" sx={{ fontSize: 11 }}>
            {inc.incident_id} · {inc.attack_type} · {inc.severity}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function HistoricalPanel({ incidents }: { incidents: Incident[] }) {
  const matched = incidents.filter(i => i.historical_match && i.prediction === 'ANOMALY').slice(0, 5);
  return (
    <Box>
      {matched.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No historical matches yet.</Typography>
      ) : (
        matched.map((inc) => (
          <Box key={inc.id} sx={{ mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="primary.main" fontWeight={700}>{inc.incident_id}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">Attack: {inc.attack_type}</Typography>
              <Typography variant="caption" color="text.secondary">Similarity: {inc.similarity_score.toFixed(1)}%</Typography>
              <SeverityBadge level={inc.severity} />
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

export default function Dashboard() {
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [trends,    setTrends]    = useState<AttackTrend[]>([]);
  const [protocols, setProtocols] = useState<{ protocol: string; count: number }[]>([]);
  const [severity,  setSeverity]  = useState<{ severity: string; count: number }[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState(0);
  const theme = useTheme();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, t, p, sv, inc] = await Promise.all([
        fetchStats(), fetchTrends(14), fetchProtocols(), fetchSeverity(), fetchIncidents(0, 100),
      ]);
      setStats(s); setTrends(t); setProtocols(p); setSeverity(sv); setIncidents(inc.items);
    } catch {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Security Operations Center</Typography>
          <Typography variant="caption" color="text.secondary">Real-time intrusion detection & threat intelligence</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={load} disabled={loading} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Events',    value: stats?.total_events     ?? 0, color: 'default' as const, icon: <TrendingUp /> },
          { label: 'Normal Traffic',  value: stats?.normal_traffic   ?? 0, color: 'success' as const, icon: <CheckCircle /> },
          { label: 'Anomalies',       value: stats?.anomalies        ?? 0, color: 'warning' as const, icon: <Warning /> },
          { label: 'Critical Threats',value: stats?.critical_threats ?? 0, color: 'error'   as const, icon: <BugReport /> },
          { label: 'Resolved',        value: stats?.resolved_incidents ?? 0, color: 'info'  as const, icon: <Security /> },
        ].map(c => (
          <Grid item xs={12} sm={6} md={2.4} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* Tab navigation for enterprise panels */}
      <Paper sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview"           sx={{ fontSize: 12 }} />
          <Tab label="Threat Heatmap"     sx={{ fontSize: 12 }} />
          <Tab label="Alert Center"       sx={{ fontSize: 12 }} />
          <Tab label="Knowledge Graph"    sx={{ fontSize: 12 }} />
          <Tab label="Agent Analytics"    sx={{ fontSize: 12 }} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* ── Tab 0: Overview ───────────────────────────────────────── */}
          {tab === 0 && (
            <Grid container spacing={2}>
              {/* Attack Trend */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Attack Trend (14 days)</Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="anom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f85149" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="norm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3fb950" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                      <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                      <RTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                      <Legend />
                      <Area type="monotone" dataKey="anomalies" stroke="#f85149" fill="url(#anom)" strokeWidth={2} />
                      <Area type="monotone" dataKey="normal"    stroke="#3fb950" fill="url(#norm)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Protocol Pie */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Protocol Distribution</Typography>
                  {protocols.length === 0
                    ? <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.secondary">No data yet</Typography></Box>
                    : <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={protocols} dataKey="count" nameKey="protocol" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                            {protocols.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <RTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                  }
                </Paper>
              </Grid>

              {/* Severity + Live Log + Historical */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Threat Severity</Typography>
                  {severity.length === 0
                    ? <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.secondary">No data</Typography></Box>
                    : <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={severity} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                          <YAxis dataKey="severity" type="category" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} width={70} />
                          <RTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {severity.map((row, i) => (
                              <Cell key={i} fill={row.severity === 'CRITICAL' ? '#f85149' : row.severity === 'HIGH' ? '#d29922' : row.severity === 'MEDIUM' ? '#3b82d4' : '#3fb950'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                  }
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Live Event Stream</Typography>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                  </Box>
                  <LiveLog incidents={incidents} />
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Historical Comparison</Typography>
                  <HistoricalPanel incidents={incidents} />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* ── Tab 1: Threat Heatmap ─────────────────────────────────── */}
          {tab === 1 && <ThreatHeatmap />}

          {/* ── Tab 2: Alert Center ───────────────────────────────────── */}
          {tab === 2 && <AlertCenter />}

          {/* ── Tab 3: Knowledge Graph ────────────────────────────────── */}
          {tab === 3 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Cyber Threat Knowledge Graph
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Interactive graph of attack types, protocols, services, and severities. Click a node to explore relationships.
              </Typography>
              <KnowledgeGraph />
            </Box>
          )}

          {/* ── Tab 4: Agent Analytics ────────────────────────────────── */}
          {tab === 4 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Agent Performance Analytics</Typography>
              <AgentAnalytics />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Incidents Table */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>Recent Incidents</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Incident ID', 'Attack Type', 'Severity', 'Prediction', 'Confidence', 'Historical Match', 'Status', 'Timestamp'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="caption" color="text.secondary">No incidents recorded. Submit traffic from the Chat Assistant.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                incidents.slice(0, 50).map((inc) => (
                  <TableRow key={inc.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'primary.main' }}>{inc.incident_id}</TableCell>
                    <TableCell>{inc.attack_type}</TableCell>
                    <TableCell><SeverityBadge level={inc.severity} /></TableCell>
                    <TableCell><SeverityBadge level={inc.prediction} /></TableCell>
                    <TableCell>{inc.confidence.toFixed(1)}%</TableCell>
                    <TableCell>
                      {inc.historical_match
                        ? <Typography variant="caption" color="success.main" fontWeight={700}>YES ({inc.similarity_score.toFixed(0)}%)</Typography>
                        : <Typography variant="caption" color="text.secondary">NO</Typography>}
                    </TableCell>
                    <TableCell><SeverityBadge level={inc.status} /></TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{new Date(inc.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
