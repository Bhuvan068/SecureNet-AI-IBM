import React from 'react';

export const ExecutiveSOCDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1>Executive SOC Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Total Incidents</h3>
          <p style={{ fontSize: '2rem', color: '#38bdf8' }}>1,204</p>
        </div>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Active Threats</h3>
          <p style={{ fontSize: '2rem', color: '#f87171' }}>14</p>
        </div>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Agent Accuracy</h3>
          <p style={{ fontSize: '2rem', color: '#4ade80' }}>94.2%</p>
        </div>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Mean Resolution Time</h3>
          <p style={{ fontSize: '2rem', color: '#c084fc' }}>12 mins</p>
        </div>
      </div>
      <div style={{ marginTop: '2rem', padding: '2rem', background: '#1e293b', borderRadius: '8px' }}>
        <h2>Risk Distribution</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
           <div style={{ flex: 1, height: '20px', background: '#4ade80' }} title="Low: 60%"></div>
           <div style={{ flex: 0.25, height: '20px', background: '#fbbf24' }} title="Medium: 25%"></div>
           <div style={{ flex: 0.1, height: '20px', background: '#f87171' }} title="High: 10%"></div>
           <div style={{ flex: 0.05, height: '20px', background: '#dc2626' }} title="Critical: 5%"></div>
        </div>
      </div>
    </div>
  );
};
