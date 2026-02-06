const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
app.use(helmet());

// CORS configuration (Hackathon safe + Vercel safe)
app.use(cors({
  origin: '*',
  credentials: false,
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

// ✅ Root route (important for Render test)
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AI Trading Coach Backend Running',
    status: 'ok',
    health: '/health',
    api: '/api'
  });
});

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

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    availableRoutes: ['/health', '/api', '/api/trades', '/api/coach', '/api/history', '/api/session']
  });
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
