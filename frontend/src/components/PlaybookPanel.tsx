import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, LinearProgress,
  Alert, Divider, Stepper, Step, StepLabel,
  StepContent, Button, Grid,
} from '@mui/material';
import {
  Security as ShieldIcon, BugReport, CheckCircle, PendingActions,
} from '@mui/icons-material';
import { fetchIncidentPlaybook, type Playbook } from '../api/enterprise';

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  COMPLETED: 'success',
  RUNNING:   'warning',
  PENDING:   'default',
};

interface Props {
  incidentId: string;
  attackType?: string;
}

export default function PlaybookPanel({ incidentId, attackType }: Props) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [active,   setActive]   = useState(0);
  const [stepStatus, setStepStatus] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    fetchIncidentPlaybook(incidentId)
      .then(pb => { setPlaybook(pb); setActive(0); setStepStatus({}); })
      .catch(() => setError('Could not load playbook.'))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return <LinearProgress />;
  if (error || !playbook) return <Alert severity="info">{error || 'No playbook.'}</Alert>;

  const markStep = (idx: number, status: string) => {
    setStepStatus(prev => ({ ...prev, [idx]: status }));
    if (status === 'COMPLETED' && idx < playbook.steps.length - 1) {
      setActive(idx + 1);
    }
  };

  const allDone = playbook.steps.every((_, i) => stepStatus[i] === 'COMPLETED');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <ShieldIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700}>{playbook.threat}</Typography>
        {allDone && (
          <Chip label="All steps completed" color="success" size="small" icon={<CheckCircle />} />
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Stepper activeStep={active} orientation="vertical" nonLinear>
            {playbook.steps.map((step, idx) => {
              const status = stepStatus[idx] ?? step.status;
              return (
                <Step key={idx} completed={status === 'COMPLETED'}>
                  <StepLabel
                    optional={
                      <Chip
                        label={step.tool}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 9, height: 16 }}
                      />
                    }
                    error={status === 'FAILED'}
                  >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={idx === active ? 600 : 400}>
                        {step.action}
                      </Typography>
                      <Chip
                        label={status}
                        color={STATUS_COLOR[status] ?? 'default'}
                        size="small"
                        sx={{ fontSize: 9, height: 16 }}
                      />
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small" variant="contained"
                        onClick={() => markStep(idx, 'COMPLETED')}
                        disabled={status === 'COMPLETED'}
                        startIcon={<CheckCircle />}
                        sx={{ fontSize: 11 }}
                      >
                        Mark Done
                      </Button>
                      <Button
                        size="small" variant="outlined" color="error"
                        onClick={() => markStep(idx, 'FAILED')}
                        disabled={status === 'COMPLETED'}
                        sx={{ fontSize: 11 }}
                      >
                        Failed
                      </Button>
                      {idx > 0 && (
                        <Button size="small" onClick={() => setActive(idx - 1)} sx={{ fontSize: 11 }}>
                          Back
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Typography variant="caption" fontWeight={700} color="error.main" sx={{ textTransform: 'uppercase' }}>
              Escalation Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 12 }}>
              {playbook.escalation}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
              KPIs
            </Typography>
            <Box sx={{ mt: 1 }}>
              {playbook.kpis.map((kpi, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.8, mb: 0.6 }}>
                  <CheckCircle sx={{ fontSize: 12, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">{kpi}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Progress summary */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Progress: {Object.values(stepStatus).filter(s => s === 'COMPLETED').length} / {playbook.steps.length} steps
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Object.values(stepStatus).filter(s => s === 'COMPLETED').length / playbook.steps.length * 100}
              sx={{ mt: 0.5, borderRadius: 1 }}
              color={allDone ? 'success' : 'primary'}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
