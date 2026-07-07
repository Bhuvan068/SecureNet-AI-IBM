import React, { useState } from 'react';

export const DigitalTwinDashboard: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  const nodes = ['Internet', 'Firewall', 'Router', 'Web Server', 'Database'];

  const playSimulation = () => {
    setPlaying(true);
    setStep(0);
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= nodes.length) {
          clearInterval(interval);
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <h1>Cyber Digital Twin</h1>
      <p style={{ color: '#94a3b8' }}>Real-time Visualization of Attack Propagation</p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button onClick={playSimulation} disabled={playing} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {playing ? 'Simulating...' : 'Start Replay'}
        </button>
        <button onClick={() => setStep(0)} style={{ padding: '0.5rem 1rem', background: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem', gap: '2rem' }}>
        {nodes.map((node, i) => {
          let color = '#3b82f6'; // Safe blue
          let shadow = 'none';
          
          if (step > i) {
            color = '#f87171'; // Compromised red
            shadow = '0 0 20px #f87171';
          } else if (step === i) {
            color = '#fbbf24'; // Active warning yellow
            shadow = '0 0 20px #fbbf24';
          }
          
          return (
            <React.Fragment key={node}>
              <div style={{ 
                padding: '1rem 3rem', 
                background: '#1e293b', 
                border: `2px solid ${color}`, 
                borderRadius: '8px',
                boxShadow: shadow,
                transition: 'all 0.5s ease',
                width: '200px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {node}
              </div>
              {i < nodes.length - 1 && (
                <div style={{ width: '4px', height: '40px', background: step > i ? '#f87171' : '#334155', transition: 'background 0.5s ease' }}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {step >= nodes.length && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#4ade80', fontSize: '1.2rem', fontWeight: 'bold' }}>
          ✓ Attack Detected and Mitigated at Web Server
        </div>
      )}
    </div>
  );
};
