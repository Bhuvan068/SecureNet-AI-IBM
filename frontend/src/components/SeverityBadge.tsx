import React from 'react';
import { Chip } from '@mui/material';

type Level = string;

const COLOR_MAP: Record<string, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  CRITICAL: 'error',
  HIGH:     'warning',
  MEDIUM:   'info',
  LOW:      'success',
  ANOMALY:  'error',
  NORMAL:   'success',
  OPEN:     'warning',
  RESOLVED: 'success',
  ESCALATED:'error',
  CLOSED:   'default',
};

export default function SeverityBadge({ level }: { level: Level }) {
  const color = COLOR_MAP[level?.toUpperCase()] ?? 'default';
  return (
    <Chip
      label={level}
      color={color}
      size="small"
      sx={{ fontWeight: 600, fontSize: 11, height: 22 }}
    />
  );
}
