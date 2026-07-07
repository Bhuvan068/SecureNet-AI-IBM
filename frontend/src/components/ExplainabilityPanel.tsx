import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, LinearProgress, Alert, Chip, Divider,
  Grid, useTheme,
} from '@mui/material';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Cell } from 'recharts';
import { fetchExplainability, type ExplainabilityReport } from '../api/enterprise';

const CONTRIB_COLOR: Record<string, string> = {
  HIGH:   '#f85149',
  MEDIUM: '#d29922',
  LOW:    '#3b82d4',
};

interface Props { incidentId: string; }

export default function ExplainabilityPanel({ incidentId }: Props) {
  const [report,  setReport]  = useState<ExplainabilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const theme = useTheme();

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    fetchExplainability(incidentId)
      .then(setReport)
      .catch(() => setError('Unable to load explainability data.'))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return <LinearProgress />;
  if (error || !report) return <Alert severity="info">{error || 'No data.'}</Alert>;

  const radarData = report.top_features.slice(0, 7).map(f => ({
    feature: f.feature.replace(/_/g, ' '),
    weight:  Math.round(f.weight * 100),
  }));

  const barData = report.top_features.map(f => ({
    feature: f.feature.replace(/_/g, ' ').slice(0, 14),
    weight:  Math.round(f.weight * 100),
    contribution: f.contribution,
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`Prediction: ${report.prediction}`}
          color={report.prediction === 'ANOMALY' ? 'error' : 'success'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
        <Chip
          label={`Confidence: ${report.confidence.toFixed(1)}%`}
          color="primary"
          size="small"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        {/* Feature weights bar chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Top Feature Contributions
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} width={110} />
                <RTooltip
                  contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}%`, 'Weight']}
                />
                <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={CONTRIB_COLOR[d.contribution] ?? '#3b82d4'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Radar */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Feature Importance Radar
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke={theme.palette.divider} />
                <PolarAngleAxis dataKey="feature" tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                <Radar name="Weight" dataKey="weight" stroke="#3b82d4" fill="#3b82d4" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Feature table */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Feature Detail
            </Typography>
            <Box sx={{ mt: 1 }}>
              {report.top_features.map(f => (
                <Box key={f.feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                  <Typography variant="caption" sx={{ width: 160, fontFamily: 'monospace', color: 'primary.main' }}>{f.feature}</Typography>
                  <Typography variant="caption" sx={{ width: 60 }}>val: {f.value}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ height: 6, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ width: `${f.weight * 100 * 5}%`, height: '100%', bgcolor: CONTRIB_COLOR[f.contribution] ?? '#3b82d4', borderRadius: 1 }} />
                    </Box>
                  </Box>
                  <Chip label={f.contribution} size="small" sx={{ fontSize: 9, height: 16, bgcolor: `${CONTRIB_COLOR[f.contribution]}22`, color: CONTRIB_COLOR[f.contribution] }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Reasoning Path */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Reasoning Path (Chain-of-Thought)
            </Typography>
            <Box sx={{ mt: 1 }}>
              {report.reasoning_path.map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8 }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontSize: 9, color: '#fff', lineHeight: 1 }}>{i + 1}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{step.replace(/^\d+\.\s*/, '')}</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5 }}>
              {report.recommendation_rationale}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
