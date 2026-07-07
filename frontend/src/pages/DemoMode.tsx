import React, { useState } from 'react';
import axios from 'axios';

export const DemoMode: React.FC = () => {
  const [scenario, setScenario] = useState('Enterprise DDoS');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDemo = async () => {
    setRunning(true);
    try {
      const response = await axios.post(`/api/v1/demo/run?scenario=${scenario}`);
      setResult(response.data);
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1>Autonomous Demo Engine</h1>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {['Home Network', 'College SOC', 'Startup SOC', 'Enterprise DDoS', 'Brute Force'].map(scen => (
          <label key={scen} style={{ cursor: 'pointer', background: '#1e293b', padding: '1rem', borderRadius: '8px', border: scenario === scen ? '2px solid #3b82f6' : '2px solid transparent' }}>
            <input type="radio" value={scen} checked={scenario === scen} onChange={e => setScenario(e.target.value)} style={{ display: 'none' }} />
            {scen}
          </label>
        ))}
      </div>
      <button onClick={runDemo} disabled={running} style={{ marginTop: '2rem', background: '#3b82f6', color: 'white', padding: '1rem 2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>
        {running ? 'RUNNING DEMO...' : 'RUN DEMO'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', background: '#1e293b', padding: '2rem', borderRadius: '8px' }}>
          <h3>Demo Complete: {result.scenario}</h3>
          <p>Execution Time: {result.execution_time}s</p>
          <p>Incident ID: {result.incident_id}</p>
        </div>
      )}
    </div>
  );
};
