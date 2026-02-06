const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  groqApiKey: process.env.GROQ_API_KEY || '',
  useMockAI: !process.env.GROQ_API_KEY || process.env.USE_MOCK_AI === 'true',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
};

if (!config.groqApiKey && !config.useMockAI) {
  console.warn('⚠️  GROQ_API_KEY not found. Falling back to mock AI.');
}

module.exports = config;
