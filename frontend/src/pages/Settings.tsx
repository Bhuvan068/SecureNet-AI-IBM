import React, { useState } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, Divider,
  Switch, FormControlLabel, Select, MenuItem, FormControl,
  InputLabel, Alert, Snackbar, useTheme, Slider,
} from '@mui/material';
import { Save as SaveIcon, Restore as RestoreIcon } from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

const STORAGE_KEY = 'securenet_settings';

const DEFAULT_SETTINGS = {
  ibm_api_key: '',
  ibm_deployment_url: 'https://us-south.ml.cloud.ibm.com',
  ibm_deployment_id: '',
  ibm_project_id: '',
  ibm_space_id: '',
  granite_model_id: 'ibm/granite-13b-instruct-v2',
  alert_threshold: 85,
  auto_refresh: true,
  refresh_interval: 30,
  notifications: true,
  max_batch_size: 500,
};

type SettingsData = typeof DEFAULT_SETTINGS;

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings);
  const [saved, setSaved]       = useState(false);
  const { theme: mode, toggleTheme } = useAppStore();
  const muiTheme = useTheme();

  const update = (key: keyof SettingsData, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  const restore = () => setSettings({ ...DEFAULT_SETTINGS });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Paper sx={{ p: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{title}</Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Settings</Typography>
          <Typography variant="caption" color="text.secondary">Configure SecureNet AI platform preferences</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestoreIcon />} onClick={restore} size="small">Restore Defaults</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} size="small">Save Settings</Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {/* Theme */}
          <Section title="Appearance">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Theme Mode</Typography>
                <Typography variant="caption" color="text.secondary">
                  {mode === 'dark' ? '🌙 Dark Mode active' : '☀ Light Mode active'}
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />}
                label={mode === 'dark' ? 'Dark' : 'Light'}
                labelPlacement="start"
              />
            </Box>
          </Section>

          {/* IBM Credentials */}
          <Section title="IBM Cloud Credentials">
            <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
              These settings are stored locally. Set environment variables on the backend for production use.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="IBM API Key"
                  type="password"
                  fullWidth size="small"
                  value={settings.ibm_api_key}
                  onChange={(e) => update('ibm_api_key', e.target.value)}
                  placeholder="Your IBM Cloud API Key"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Deployment URL"
                  fullWidth size="small"
                  value={settings.ibm_deployment_url}
                  onChange={(e) => update('ibm_deployment_url', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="AutoAI Deployment ID"
                  fullWidth size="small"
                  value={settings.ibm_deployment_id}
                  onChange={(e) => update('ibm_deployment_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Space ID"
                  fullWidth size="small"
                  value={settings.ibm_space_id}
                  onChange={(e) => update('ibm_space_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="watsonx Project ID"
                  fullWidth size="small"
                  value={settings.ibm_project_id}
                  onChange={(e) => update('ibm_project_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Granite Model</InputLabel>
                  <Select
                    value={settings.granite_model_id}
                    label="Granite Model"
                    onChange={(e) => update('granite_model_id', e.target.value)}
                  >
                    <MenuItem value="ibm/granite-13b-instruct-v2">Granite 13B Instruct v2</MenuItem>
                    <MenuItem value="ibm/granite-20b-multilingual">Granite 20B Multilingual</MenuItem>
                    <MenuItem value="meta-llama/llama-3-8b-instruct">Llama 3 8B Instruct</MenuItem>
                    <MenuItem value="meta-llama/llama-3-70b-instruct">Llama 3 70B Instruct</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Section>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Dashboard */}
          <Section title="Dashboard & Monitoring">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.auto_refresh} onChange={(e) => update('auto_refresh', e.target.checked)} color="primary" />}
                  label="Auto-refresh dashboard"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Refresh Interval: <strong>{settings.refresh_interval}s</strong>
                </Typography>
                <Slider
                  value={settings.refresh_interval}
                  onChange={(_, v) => update('refresh_interval', v)}
                  min={10} max={120} step={10}
                  marks={[
                    { value: 10, label: '10s' },
                    { value: 60, label: '60s' },
                    { value: 120, label: '2m' },
                  ]}
                  disabled={!settings.auto_refresh}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications} onChange={(e) => update('notifications', e.target.checked)} color="primary" />}
                  label="Enable alert notifications"
                />
              </Grid>
            </Grid>
          </Section>

          {/* Alert thresholds */}
          <Section title="Alert Thresholds">
            <Typography variant="body2" gutterBottom>
              Historical similarity threshold: <strong>{settings.alert_threshold}%</strong>
            </Typography>
            <Slider
              value={settings.alert_threshold}
              onChange={(_, v) => update('alert_threshold', v)}
              min={50} max={100} step={5}
              marks={[
                { value: 50,  label: '50%' },
                { value: 75,  label: '75%' },
                { value: 100, label: '100%' },
              ]}
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              Historical matches above this threshold will trigger mitigation reuse recommendation.
            </Typography>
          </Section>

          {/* Database */}
          <Section title="Database Settings">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Max Batch Size"
                  type="number"
                  fullWidth size="small"
                  value={settings.max_batch_size}
                  onChange={(e) => update('max_batch_size', parseInt(e.target.value) || 500)}
                  helperText="Maximum records per file upload"
                />
              </Grid>
            </Grid>
          </Section>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Settings saved successfully"
      />
    </Box>
  );
}
