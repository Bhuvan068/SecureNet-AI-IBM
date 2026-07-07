import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, LinearProgress, Alert, Chip, Divider,
  useTheme, Grid,
} from '@mui/material';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { fetchHeatmapData } from '../api/enterprise';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const HEAT_COLORS = ['#0d1117', '#0c2d6b', '#1a4ba8', '#2563eb', '#3b82d4', '#f85149', '#ff6b35', '#ffd700'];

function interpolateColor(value: number, max: number): string {
  if (max === 0) return HEAT_COLORS[0];
  const ratio = value / max;
  const idx   = Math.min(Math.floor(ratio * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1);
  return HEAT_COLORS[idx];
}

interface HeatCell { hour: number; dow: number; count: number; }

export default function ThreatHeatmap() {
  const [data,    setData]    = useState<{
    hourly_heatmap: HeatCell[];
    service_frequency: { service: string; count: number }[];
    confidence_by_attack: { attack_type: string; avg_confidence: number; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    fetchHeatmapData()
      .then(setData)
      .catch(() => setError('No heatmap data yet. Run some intrusion analyses first.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (error || !data) return (
    <Alert severity="info" sx={{ mt: 1 }}>
      {error || 'No heatmap data available yet.'}
    </Alert>
  );

  // Build grid
  const grid: Record<string, number> = {};
  let maxCount = 0;
  for (const cell of data.hourly_heatmap) {
    const key = `${cell.hour}-${cell.dow}`;
    grid[key] = (grid[key] ?? 0) + cell.count;
    maxCount  = Math.max(maxCount, grid[key]);
  }

  const scatterData = Object.entries(grid).map(([key, count]) => {
    const [hour, dow] = key.split('-').map(Number);
    return { x: hour, y: dow, z: count, fill: interpolateColor(count, maxCount) };
  });

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Hourly Heatmap */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Attack Density Heatmap — Hour × Day of Week
            </Typography>
            {scatterData.length === 0 ? (
              <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">No anomaly events recorded yet.</Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="x" type="number" name="Hour" domain={[0, 23]}
                      tickFormatter={h => `${h}h`}
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    />
                    <YAxis
                      dataKey="y" type="number" name="Day" domain={[0, 6]}
                      tickFormatter={d => DAYS[d] ?? ''}
                      tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    />
                    <ZAxis dataKey="z" range={[30, 250]} name="Events" />
                    <RTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 11 }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={() => ''}
                    />
                    <Scatter data={scatterData} shape={(props: unknown) => {
                      const p = props as { cx: number; cy: number; r: number; payload: { fill: string } };
                      return <circle cx={p.cx} cy={p.cy} r={p.r / 2.5} fill={p.payload?.fill ?? '#3b82d4'} opacity={0.85} />;
                    }} />
                  </ScatterChart>
                </ResponsiveContainer>
                {/* Legend */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Low</Typography>
                  {HEAT_COLORS.map(c => (
                    <Box key={c} sx={{ width: 16, height: 10, bgcolor: c, borderRadius: 0.5 }} />
                  ))}
                  <Typography variant="caption" color="text.secondary">High</Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Service Frequency */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Top Attacked Services
            </Typography>
            {data.service_frequency.length === 0 ? (
              <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.service_frequency.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis dataKey="service" type="category" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} width={60} />
                  <RTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.service_frequency.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={HEAT_COLORS[3 + (i % 5)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Confidence by Attack */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Average Confidence Score by Attack Type
            </Typography>
            {data.confidence_by_attack.length === 0 ? (
              <Alert severity="info">No confidence data yet.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.confidence_by_attack}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="attack_type" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <RTooltip
                    contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, 'Avg Confidence']}
                  />
                  <Bar dataKey="avg_confidence" fill="#3b82d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
