import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, TextField, CircularProgress, Fab, Collapse } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { sendChat } from '../api/client';

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user'|'assistant', content: string }[]>([
    { role: 'assistant', content: 'Hi, I am your SOC Copilot. Ask me about alerts, live events, trends, or analytics.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await sendChat(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error connecting to the backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <Collapse in={open} unmountOnExit>
        <Paper elevation={6} sx={{ width: 350, height: 450, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" fontWeight={600}>SecureNet AI Copilot</Typography>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'background.default' }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <Paper sx={{ p: 1, px: 1.5, bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper', color: m.role === 'user' ? '#fff' : 'text.primary', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                </Paper>
              </Box>
            ))}
            {loading && <CircularProgress size={16} sx={{ mt: 1, alignSelf: 'flex-start' }} />}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ p: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth size="small" placeholder="Ask a question..." 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
      
      {!open && (
        <Fab color="primary" onClick={() => setOpen(true)} aria-label="chat">
          <ChatIcon />
        </Fab>
      )}
    </Box>
  );
}
