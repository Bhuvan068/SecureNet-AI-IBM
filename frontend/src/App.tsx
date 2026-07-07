import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { buildTheme } from './theme';
import { useAppStore } from './store/appStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChatAssistant from './pages/ChatAssistant';
import Settings from './pages/Settings';

export default function App() {
  const mode = useAppStore((s) => s.theme);
  const muiTheme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: { colorPrimary: mode === 'dark' ? '#3b82d4' : '#0969da' },
        }}
      >
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<ChatAssistant />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ThemeProvider>
  );
}
