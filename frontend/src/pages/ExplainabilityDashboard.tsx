import React from 'react';

export const ExplainabilityDashboard: React.FC = () => {
  const topFeatures = [
    { name: 'service', value: 34 },
    { name: 'flag', value: 21 },
    { name: 'src_bytes', value: 18 },
    { name: 'srv_count', value: 14 },
    { name: 'dst_host_count', value: 13 }
  ];

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <h1>Explainability (XAI) Report</h1>
      <p style={{ color: '#94a3b8' }}>Transparent AI Decision Making</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Top Contributing Features</h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {topFeatures.map(f => (
              <div key={f.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span>{f.name}</span>
                  <span>{f.value}%</span>
                </div>
                <div style={{ width: '100%', background: '#334155', height: '8px', borderRadius: '4px' }}>
                  <div style={{ width: `${f.value}%`, background: '#f87171', height: '100%', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Human-Readable Explanation</h3>
          <p style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '1.1rem', color: '#e2e8f0', background: '#0f172a', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #3b82f6' }}>
            "This traffic was classified as anomalous because it exhibits high packet volume, repeated service requests, and abnormal protocol behavior consistent with previously observed attacks."
          </p>
          
          <h4 style={{ marginTop: '2rem' }}>Decision Path:</h4>
          <div style={{ marginTop: '1rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>1. High connection volume</div>
            <div style={{ marginLeft: '1rem' }}>↓</div>
            <div>2. Repeated service requests</div>
            <div style={{ marginLeft: '1rem' }}>↓</div>
            <div>3. Abnormal packet behavior</div>
            <div style={{ marginLeft: '1rem' }}>↓</div>
            <div style={{ color: '#f87171', fontWeight: 'bold' }}>ANOMALY</div>
          </div>
        </div>
      </div>
    </div>
  );
};
