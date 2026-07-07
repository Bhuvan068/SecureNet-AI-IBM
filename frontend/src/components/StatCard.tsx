import React from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'default' | 'primary' | 'error' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, sub, color = 'default', icon }: Props) {
  const theme = useTheme();

  const colorMap: Record<string, string> = {
    default: theme.palette.primary.main,
    primary: theme.palette.primary.main,
    error:   theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    info:    theme.palette.info?.main ?? '#17a2b8',
  };

  const accent = colorMap[color] ?? colorMap.default;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${accent}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        minHeight: 100,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">
          {label}
        </Typography>
        {icon && <Box sx={{ color: accent, opacity: 0.8 }}>{icon}</Box>}
      </Box>
      <Typography variant="h4" fontWeight={700} sx={{ color: accent, lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      )}
    </Box>
  );
}
