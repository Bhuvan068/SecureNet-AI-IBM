import { createTheme } from '@mui/material/styles';

export const buildTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            background: { default: '#0d1117', paper: '#161b22' },
            primary:    { main: '#3b82d4' },
            secondary:  { main: '#7c5cd8' },
            error:      { main: '#f85149' },
            warning:    { main: '#d29922' },
            success:    { main: '#3fb950' },
            text: { primary: '#e6edf3', secondary: '#8b949e' },
            divider: '#30363d',
          }
        : {
            background: { default: '#f6f8fa', paper: '#ffffff' },
            primary:    { main: '#0969da' },
            secondary:  { main: '#8250df' },
            error:      { main: '#cf222e' },
            warning:    { main: '#9a6700' },
            success:    { main: '#1a7f37' },
            text: { primary: '#1f2328', secondary: '#57606a' },
            divider: '#d0d7de',
          }),
    },
    typography: {
      fontFamily: `-apple-system, 'Segoe UI', system-ui, sans-serif`,
      fontSize: 13,
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-head': {
              backgroundColor: theme.palette.background.paper,
              fontWeight: 600,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.palette.text.secondary,
            },
          }),
        },
      },
    },
  });
