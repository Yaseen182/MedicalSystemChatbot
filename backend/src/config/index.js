require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 4000,
  env: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model:  process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  chroma: {
    url:        process.env.CHROMA_URL || 'http://localhost:8000',
    collection: process.env.CHROMA_COLLECTION || 'medai_knowledge',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
    aiMax:    parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = config;