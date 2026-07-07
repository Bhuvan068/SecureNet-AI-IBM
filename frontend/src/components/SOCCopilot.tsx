import React, { useState } from 'react';
import axios from 'axios';

export const SOCCopilot: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);

  const sendMessage = async () => {
    if (!input) return;
    setHistory(prev => [...prev, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');
    
    try {
      const response = await axios.post('/api/v1/copilot/chat', { message: currentInput });
      setHistory(prev => [...prev, { role: 'agent', text: response.data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'agent', text: 'Error connecting to Copilot.' }]);
    }
  };

  return (
    <div style={{ width: '350px', position: 'fixed', right: 0, top: 0, bottom: 0, background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #334155', fontWeight: 'bold', color: '#f8fafc' }}>
        SOC Copilot (IBM Granite)
      </div>
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {history.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? '#3b82f6' : '#334155',
            color: 'white', padding: '0.75rem', borderRadius: '8px', maxWidth: '80%' 
          }}>
            {msg.text}
          </div>
        ))}
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Copilot..." 
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }} 
        />
        <button onClick={sendMessage} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
};
