const express = require('express');
const router = express.Router();

// In-memory session storage (for demo)
// In production, use Redis or database
const sessions = new Map();

// Get or create session
router.get('/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || `session_${Date.now()}`;
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      messages: [],
      metadata: {
        tradeCount: 0,
        totalProfit: 0,
        winRate: 0,
        biasesDetected: []
      }
    });
  }
  
  const session = sessions.get(sessionId);
  session.lastActive = new Date().toISOString();
  
  res.json({
    success: true,
    session
  });
});

// Add message to session
router.post('/:sessionId/message', (req, res) => {
  const { sessionId } = req.params;
  const { role, content, type = 'coaching' } = req.body;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  const session = sessions.get(sessionId);
  const message = {
    id: `msg_${Date.now()}`,
    role,
    content,
    type,
    timestamp: new Date().toISOString()
  };
  
  session.messages.push(message);
  session.lastActive = new Date().toISOString();
  
  // Keep only last 50 messages
  if (session.messages.length > 50) {
    session.messages = session.messages.slice(-50);
  }
  
  res.json({
    success: true,
    message,
    sessionId
  });
});

// Update session metadata
router.put('/:sessionId/metadata', (req, res) => {
  const { sessionId } = req.params;
  const updates = req.body;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  const session = sessions.get(sessionId);
  session.metadata = { ...session.metadata, ...updates };
  session.lastActive = new Date().toISOString();
  
  res.json({
    success: true,
    metadata: session.metadata
  });
});

// Get coaching history
router.get('/:sessionId/history', (req, res) => {
  const { sessionId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type; // 'coaching', 'analysis', 'all'
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  const session = sessions.get(sessionId);
  let messages = session.messages;
  
  if (type && type !== 'all') {
    messages = messages.filter(m => m.type === type);
  }
  
  messages = messages.slice(-limit);
  
  res.json({
    success: true,
    messages,
    total: session.messages.length,
    sessionId
  });
});

// Clear session messages
router.delete('/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  const session = sessions.get(sessionId);
  session.messages = [];
  session.lastActive = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Session messages cleared'
  });
});

// Get all active sessions (admin/view)
router.get('/admin/sessions', (req, res) => {
  const allSessions = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    createdAt: session.createdAt,
    lastActive: session.lastActive,
    messageCount: session.messages.length,
    metadata: session.metadata
  }));
  
  res.json({
    success: true,
    sessions: allSessions,
    total: sessions.size
  });
});

module.exports = router;
