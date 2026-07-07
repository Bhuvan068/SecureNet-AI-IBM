import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Badge, IconButton, List,
  ListItem, ListItemText, Tooltip, CircularProgress, Button, Divider,
  TextField, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent
} from '@mui/material';
import {
  Notifications as BellIcon, NotificationsOff,
  Circle as DotIcon, CheckCircle, DeleteOutline, DoneAll
} from '@mui/icons-material';
import {
  fetchAlerts, updateAlertStatus, markAlertRead,
  type AlertItem,
} from '../api/client';

const SEV_COLOR: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'success',
};

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  UNREAD: 'primary',
  READ: 'default',
  OPEN: 'error',
  ESCALATED: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

interface Props {
  compact?: boolean;
}

export default function AlertCenter({ compact = false }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('timestamp_desc');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const sev = severityFilter === 'ALL' ? undefined : severityFilter;
      const stat = statusFilter === 'ALL' ? undefined : statusFilter;
      const al = await fetchAlerts(stat, sev, sortBy);
      setAlerts(al);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, sortBy]);

  useEffect(() => { load(); }, [load]);

  // Poll every 20 s for new alerts
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const handleStatusUpdate = async (alertId: string, status: string) => {
    await updateAlertStatus(alertId, status);
    await load();
  };

  const handleRead = async (alertId: string) => {
    await markAlertRead(alertId);
    await load();
  };

  const filteredAlerts = useMemo(() => {
    if (!search) return alerts;
    const s = search.toLowerCase();
    return alerts.filter(a =>
      a.alert_id.toLowerCase().includes(s) ||
      a.message.toLowerCase().includes(s) ||
      a.trigger.toLowerCase().includes(s)
    );
  }, [alerts, search]);

  const unreadCount = useMemo(() => alerts.filter(a => a.status === 'UNREAD').length, [alerts]);

  if (compact) {
    return (
      <Tooltip title={`${unreadCount} unread alerts`}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ color: unreadCount > 0 ? 'error.main' : 'text.secondary' }}
          >
            {unreadCount > 0 ? <BellIcon /> : <NotificationsOff />}
          </IconButton>
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700}>Alert Center</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} color="error" size="small" sx={{ fontSize: 10 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={load} sx={{ fontSize: 11 }}>Refresh</Button>
        </Box>
      </Box>

      {/* Filters Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search alerts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 150 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Severity</InputLabel>
          <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
            <MenuItem value="ALL">All Severities</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="UNREAD">Unread</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="ESCALATED">Escalated</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="DISMISSED">Dismissed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="timestamp_desc">Newest First</MenuItem>
            <MenuItem value="timestamp_asc">Oldest First</MenuItem>
            <MenuItem value="severity_desc">Highest Severity</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && filteredAlerts.length === 0 && <CircularProgress size={20} />}

      {!loading && filteredAlerts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <NotificationsOff sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No alerts found</Typography>
        </Box>
      )}

      <List disablePadding>
        {filteredAlerts.map(alert => (
          <ListItem
            key={alert.id}
            sx={{
              mb: 1, borderRadius: 1.5,
              border: '1px solid',
              borderColor: alert.status === 'UNREAD' ? 'primary.main' : 'divider',
              bgcolor: alert.status === 'UNREAD' ? 'action.hover' : 'transparent',
              opacity: alert.status === 'DISMISSED' ? 0.6 : 1,
              px: 1.5, py: 1,
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={alert.severity}
                  color={SEV_COLOR[alert.severity] ?? 'default'}
                  size="small"
                  sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                />
                <Typography variant="caption" fontWeight={alert.status === 'UNREAD' ? 700 : 500}>
                  {alert.alert_id}
                </Typography>
                <Chip
                  label={alert.status}
                  color={STATUS_COLOR[alert.status] ?? 'default'}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: 9, height: 18 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {alert.status === 'UNREAD' && (
                  <Tooltip title="Mark as Read">
                    <IconButton size="small" onClick={() => handleRead(alert.alert_id)}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {alert.status !== 'RESOLVED' && (
                  <Tooltip title="Mark as Resolved">
                    <IconButton size="small" color="success" onClick={() => handleStatusUpdate(alert.alert_id, 'RESOLVED')}>
                      <DoneAll fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {alert.status !== 'DISMISSED' && (
                  <Tooltip title="Dismiss Alert">
                    <IconButton size="small" color="error" onClick={() => handleStatusUpdate(alert.alert_id, 'DISMISSED')}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {alert.message}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {alert.trigger}
              </Typography>
              {alert.incident_id && (
                <Chip label={`Inc: ${alert.incident_id}`} size="small" variant="outlined" sx={{ fontSize: 9, height: 16 }} />
              )}
              {alert.extra_data?.analyst && (
                <Chip label={`Analyst: ${alert.extra_data.analyst}`} size="small" sx={{ fontSize: 9, height: 16 }} />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
