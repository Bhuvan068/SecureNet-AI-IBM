import React, { useState, useEffect } from 'react';

export const HistoricalRecallPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      background: '#1e293b', borderLeft: '4px solid #3b82f6',
      padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      color: '#f8fafc', maxWidth: '400px', zIndex: 9999
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, color: '#38bdf8' }}>PREVIOUS INCIDENT DETECTED</h4>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div><span style={{ color: '#94a3b8' }}>Incident:</span> INC-2025-0145</div>
        <div><span style={{ color: '#94a3b8' }}>Attack:</span> Anomaly</div>
        <div><span style={{ color: '#94a3b8' }}>Similarity:</span> <span style={{ color: '#4ade80' }}>94%</span></div>
        <div><span style={{ color: '#94a3b8' }}>Previous Resolution:</span> Firewall Rule #45</div>
        <div><span style={{ color: '#94a3b8' }}>Mitigation Success:</span> 97%</div>
        <div><span style={{ color: '#94a3b8' }}>Resolution Time:</span> 15 minutes</div>
      </div>
      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#334155', borderRadius: '4px' }}>
        <strong>Recommendation:</strong> Reuse historical mitigation.
      </div>
    </div>
  );
};
