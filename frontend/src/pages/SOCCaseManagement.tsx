import React from 'react';

export const SOCCaseManagement: React.FC = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1>SOC Case Management</h1>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', overflowX: 'auto' }}>
        {['New', 'Assigned', 'Investigating', 'Mitigating', 'Resolved', 'Closed'].map(status => (
          <div key={status} style={{ flex: '0 0 300px', background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>{status}</h3>
            {status === 'New' && (
              <div style={{ background: '#334155', padding: '1rem', marginTop: '1rem', borderRadius: '4px' }}>
                <p><strong>CASE-1A2B3C</strong></p>
                <p>Priority: <span style={{ color: '#f87171' }}>High</span></p>
                <button style={{ marginTop: '0.5rem', background: '#3b82f6', border: 'none', padding: '0.5rem', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Assign to me</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
