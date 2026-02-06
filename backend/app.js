const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');

// Route imports
const tradesRouter = require('./routes/trades');
const coachRouter = require('./routes/coach');
const historyRouter = require('./routes/history');
const sessionRouter = require('./routes/session');

// Middleware imports
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://deriv-ai-trade-coach.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api/', rateLimiter);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/trades', tradesRouter);
app.use('/api/coach', coachRouter);
app.use('/api/history', historyRouter);
app.use('/api/session', sessionRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    aiMode: config.useMockAI ? 'mock' : 'live',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Trading Coach API',
    version: '1.0.0',
    endpoints: {
      trades: '/api/trades',
      coach: '/api/coach',
      history: '/api/history',
      session: '/api/session'
    },
    status: 'operational',
    ai: config.useMockAI ? 'mock-mode' : 'live-mode'
  });
});

// Serve frontend for any other route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
🚀 AI Trading Coach Backend Started!
-----------------------------------
🌐 Environment: ${config.nodeEnv}
📡 Port: ${PORT}
🤖 AI Mode: ${config.useMockAI ? 'MOCK (No API key)' : 'LIVE (Groq API)'}
🔗 Health: http://localhost:${PORT}/health
🔗 API: http://localhost:${PORT}/api
-----------------------------------
  `);
});

module.exports = app;
