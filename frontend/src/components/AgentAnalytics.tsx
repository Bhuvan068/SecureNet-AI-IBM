import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Box, Chip, CircularProgress, Alert } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis,
  AreaChart, Area
} from 'recharts';
import { PlayCircleFilled, CheckCircleFilled, CloseCircleFilled, DashboardOutlined } from '@ant-design/icons';
import axios from 'axios';

// Analytics Interfaces
interface AgentMetric {
  agent_name: string;
  total_executions: int;
  successful_executions: int;
  failed_executions: int;
  success_rate: float;
  failure_rate: float;
  avg_response_time_ms: float;
  median_response_time_ms: float;
  p95_latency_ms: float;
  p99_latency_ms: float;
  avg_confidence: float;
  max_confidence: float;
  min_confidence: float;
}

interface TrendPoint {
  timestamp: string;
  agent_name: string;
  value: float;
}

interface ErrorAnalysis {
  error_message: string;
  count: int;
  frequency: float;
}

interface ThroughputPoint {
  timestamp: string;
  requests_per_minute: int;
}

interface AnalyticsData {
  metrics: AgentMetric[];
  trends: TrendPoint[];
  errors: ErrorAnalysis[];
  throughput: ThroughputPoint[];
  relationship_graph: any[];
}

const COLORS = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#A28DFF', '#FF6666'];

export default function AgentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    // Initial fetch
    axios.get('http://localhost:8000/api/v1/analytics/agents')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/analytics');
    
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');
    
    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(newData);
      } catch (e) {
        console.error("Failed to parse WS data", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="info">No analytics available.</Alert>;
  if (!data) return <Alert severity="info">No analytics available.</Alert>;

  // Prepare data for 4. CONFIDENCE TREND
  const uniqueDates = Array.from(new Set(data.trends.map(t => t.timestamp)));
  const trendData = uniqueDates.map(date => {
    const obj: any = { date };
    data.trends.filter(t => t.timestamp === date).forEach(t => {
      obj[t.agent_name] = t.value;
    });
    return obj;
  });

  // Prepare data for 3. SUCCESS RATE PIE CHART (just an overall summary or first agent)
  const pieData = [
    { name: 'Success', value: data.metrics.reduce((acc, m) => acc + m.successful_executions, 0) },
    { name: 'Failure', value: data.metrics.reduce((acc, m) => acc + m.failed_executions, 0) }
  ];

  // 5. EXECUTION HEATMAP (Simulated using ScatterChart for ease)
  const heatmapData = data.metrics.map((m, idx) => ({
    x: idx,
    y: 12, // simulated hour
    z: m.total_executions,
    name: m.agent_name
  }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4"><DashboardOutlined /> Agent Performance Analytics</Typography>
        <Chip 
          icon={wsStatus === 'connected' ? <CheckCircleFilled style={{color:'lightgreen'}} /> : <CloseCircleFilled style={{color:'red'}} />} 
          label={wsStatus === 'connected' ? 'Live Updates Active' : 'Disconnected'} 
          color={wsStatus === 'connected' ? 'success' : 'error'} 
          variant="outlined" 
        />
      </Box>

      {/* 1. AGENT EXECUTION COUNTER & 10. LIVE AGENT STATUS */}
      <Grid container spacing={2} mb={4}>
        {data.metrics.map(m => (
          <Grid item xs={12} sm={6} md={3} key={m.agent_name}>
            <Card sx={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="subtitle2" color="gray">{m.agent_name}</Typography>
                <Typography variant="h4" fontWeight="bold">{m.total_executions}</Typography>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Chip size="small" icon={<PlayCircleFilled />} label="Running" color="success" />
                  <Typography variant="caption" color={m.success_rate > 90 ? 'lightgreen' : 'error'}>
                    {m.success_rate.toFixed(1)}% Success
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 2. AGENT LATENCY BAR CHART */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Agent Latency (ms)</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent_name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="avg_response_time_ms" name="Avg Latency" fill="#8884d8" />
                    <Bar dataKey="p95_latency_ms" name="P95 Latency" fill="#82ca9d" />
                    <Bar dataKey="p99_latency_ms" name="P99 Latency" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. AGENT CONFIDENCE TREND LINE CHART */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Confidence Trends</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    {data.metrics.slice(0, 3).map((m, idx) => (
                      <Line key={m.agent_name} type="monotone" dataKey={m.agent_name} stroke={COLORS[idx % COLORS.length]} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. AGENT SUCCESS RATE PIE CHART */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Overall Success Rate</Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 7. AGENT THROUGHPUT CHART */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Throughput (Req/Min)</Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.throughput}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="requests_per_minute" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 6. AGENT ERROR ANALYSIS CHART */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Error Analysis</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.errors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="error_message" type="category" width={150} tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#FF6666" name="Error Count" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 5. AGENT EXECUTION HEATMAP (Simulated with Scatter) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Execution Density</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="name" name="Agent" allowDuplicatedCategory={false} tick={{fontSize:10}} angle={-45} textAnchor="end" height={60} />
                    <YAxis type="number" dataKey="y" name="Hour" domain={[0, 24]} />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Executions" />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Executions" data={heatmapData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 8. AGENT PERFORMANCE TABLE */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Performance Data Table</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ padding: '8px' }}>Agent</th>
                      <th>Executions</th>
                      <th>Success Rate</th>
                      <th>Avg Latency</th>
                      <th>P95 Latency</th>
                      <th>Confidence</th>
                      <th>Errors</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.metrics.map(m => (
                      <tr key={m.agent_name} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '8px' }}>{m.agent_name}</td>
                        <td>{m.total_executions}</td>
                        <td><span style={{ color: m.success_rate > 90 ? 'lightgreen' : 'orange' }}>{m.success_rate.toFixed(1)}%</span></td>
                        <td>{m.avg_response_time_ms.toFixed(0)} ms</td>
                        <td>{m.p95_latency_ms.toFixed(0)} ms</td>
                        <td>{m.avg_confidence.toFixed(1)}%</td>
                        <td>{m.failed_executions}</td>
                        <td>
                          <Chip size="small" label="Active" color="success" variant="outlined" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
