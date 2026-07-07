import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, LinearProgress, Chip, Tooltip,
  CircularProgress, Alert, Divider, useTheme,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, HourglassBottom } from '@mui/icons-material';
import { fetchTimeline, type ExecutionTimeline, type TimelineStep } from '../api/enterprise';

const AGENT_ORDER = [
  'ObserverAgent', 'DetectionAgent', 'ThreatReasoningAgent',
  'HistoricalMemoryAgent', 'ComparisonEngine', 'MitigationAgent',
  'ReportAgent', 'AuditLogAgent',
];

const AGENT_COLORS: Record<string, string> = {
  ObserverAgent:         '#58a6ff',
  DetectionAgent:        '#d29922',
  ThreatReasoningAgent:  '#7c5cd8',
  HistoricalMemoryAgent: '#3b82d4',
  ComparisonEngine:      '#79c0ff',
  MitigationAgent:       '#f85149',
  ReportAgent:           '#3fb950',
  AuditLogAgent:         '#8b949e',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'SUCCESS') return <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />;
  if (status === 'FAILED')  return <ErrorIcon  sx={{ fontSize: 14, color: 'error.main'   }} />;
  return <HourglassBottom sx={{ fontSize: 14, color: 'warning.main' }} />;
}

function TimelineBar({ step, maxMs }: { step: TimelineStep; maxMs: number }) {
  const theme = useTheme();
  const color = AGENT_COLORS[step.agent_name] ?? '#3b82d4';
  const pct   = maxMs > 0 ? Math.max(4, (step.execution_time_ms / maxMs) * 100) : 4;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
      {/* Agent name */}
      <Box sx={{ width: 180, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <StatusIcon status={step.status} />
          <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>
            {step.agent_name}
          </Typography>
        </Box>
      </Box>

      {/* Bar */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Tooltip
          title={
            <Box>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Duration: {step.execution_time_ms.toFixed(1)} ms
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Decision: {step.decision || '—'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Confidence: {(step.confidence * 100).toFixed(1)}%
              </Typography>
              {step.error_message && (
                <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                  Error: {step.error_message}
                </Typography>
              )}
            </Box>
          }
          arrow
        >
          <Box
            sx={{
              height: 20, borderRadius: 1,
              bgcolor: theme.palette.action.hover,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0,
                width: `${pct}%`, height: '100%',
                bgcolor: color, borderRadius: 1,
                opacity: step.status === 'FAILED' ? 0.5 : 0.85,
                transition: 'width 0.6s ease',
              }}
            />
          </Box>
        </Tooltip>
      </Box>

      {/* Duration label */}
      <Box sx={{ width: 62, textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          {step.execution_time_ms.toFixed(0)} ms
        </Typography>
      </Box>

      {/* Confidence */}
      <Chip
        label={`${(step.confidence * 100).toFixed(0)}%`}
        size="small"
        sx={{
          fontSize: 9, height: 18, fontWeight: 600,
          bgcolor: step.status === 'SUCCESS' ? `${color}22` : 'error.main',
          color:   step.status === 'SUCCESS' ? color : '#fff',
        }}
      />
    </Box>
  );
}

interface Props {
  incidentId: string;
}

export default function AgentTimeline({ incidentId }: Props) {
  const [timeline, setTimeline] = useState<ExecutionTimeline | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    fetchTimeline(incidentId)
      .then(setTimeline)
      .catch(() => setError('No timeline data for this incident yet.'))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return <Box sx={{ py: 2 }}><LinearProgress /></Box>;
  if (error)   return <Alert severity="info" sx={{ mt: 1 }}>{error}</Alert>;
  if (!timeline) return null;

  const maxMs = Math.max(...timeline.steps.map(s => s.execution_time_ms), 1);

  // Sort by AGENT_ORDER, fallback to original order
  const sorted = [...timeline.steps].sort((a, b) => {
    const ai = AGENT_ORDER.indexOf(a.agent_name);
    const bi = AGENT_ORDER.indexOf(b.agent_name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Agent Execution Timeline
        </Typography>
        <Chip
          label={`Total: ${timeline.total_time_ms.toFixed(0)} ms`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Box>

      {sorted.map(step => (
        <TimelineBar key={step.agent_name} step={step} maxMs={maxMs} />
      ))}

      <Divider sx={{ mt: 2, mb: 1 }} />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {[['SUCCESS', 'success.main'], ['FAILED', 'error.main']].map(([s, c]) => (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
            <Typography variant="caption" color="text.secondary">{s}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
