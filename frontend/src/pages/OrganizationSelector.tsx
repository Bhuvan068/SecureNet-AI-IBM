import React, { useState } from 'react';

export const OrganizationSelector: React.FC = () => {
  const [selected, setSelected] = useState('');
  const orgs = ['Home Network', 'College Network', 'Startup Company', 'Enterprise SOC'];

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <h1>Multi-Organization Mode</h1>
      <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', marginTop: '2rem', maxWidth: '500px' }}>
        <h3>Select Organization</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {orgs.map(org => (
            <label key={org} style={{ cursor: 'pointer', padding: '1rem', background: selected === org ? '#3b82f6' : '#334155', borderRadius: '4px' }}>
              <input type="radio" value={org} checked={selected === org} onChange={e => setSelected(e.target.value)} style={{ display: 'none' }} />
              {org}
            </label>
          ))}
        </div>
        
        {selected && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #475569' }}>
            <p>Active Workspace: <strong>{selected}</strong></p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>All dashboards and analytics are now scoped to {selected}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
