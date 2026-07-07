import React, { useEffect, useState } from 'react';

interface LiveEvent {
  event_id: string;
  timestamp: string;
  protocol: string;
  service: string;
  prediction: string;
  severity: string;
  confidence: number;
}

export const LiveDashboard: React.FC = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setInterval>;

    const connect = () => {
      setWsStatus('connecting');
      ws = new WebSocket('ws://localhost:8000/api/v1/ws/live');
      
      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(prev => [data, ...prev].slice(0, 50));
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connect, 5000); // Reconnect every 5 seconds
      };
      
      ws.onerror = () => {
        ws.close(); // triggers onclose
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Live Monitoring Engine</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4ade80' }}></div>
          <span style={{ fontWeight: 'bold', color: '#4ade80' }}>LIVE</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Total Live Events</h3>
          <p style={{ fontSize: '2rem', color: '#38bdf8' }}>{events.length}</p>
        </div>
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
          <h3>Critical Threats</h3>
          <p style={{ fontSize: '2rem', color: '#f87171' }}>{events.filter(e => e.severity === 'CRITICAL').length}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', background: '#1e293b', borderRadius: '8px', padding: '1rem' }}>
        <h3>Real-time Incident Feed</h3>
        <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th>Timestamp</th>
              <th>Protocol</th>
              <th>Service</th>
              <th>Prediction</th>
              <th>Severity</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 10).map((e, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.5rem 0' }}>{e.timestamp}</td>
                <td>{e.protocol}</td>
                <td>{e.service}</td>
                <td style={{ color: e.prediction === 'ANOMALY' ? '#f87171' : '#4ade80' }}>{e.prediction}</td>
                <td>{e.severity}</td>
                <td>{e.confidence}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Waiting for live events...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
