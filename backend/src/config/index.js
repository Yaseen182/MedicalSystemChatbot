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

  // Resend transactional email (used for register OTP verification).
  resend: {
    apiKey:    process.env.RESEND_API_KEY || 're_ftuf6b4d_CQw6A9m5MsUqWBBSPDcW3fF2',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'MedAI <onboarding@resend.dev>',
    otpTtlMin: parseInt(process.env.OTP_TTL_MINUTES) || 10,
  },

  // AI logic now lives in the Python AI microservice (see /ai-service).
  aiService: {
    url:       process.env.AI_SERVICE_URL || 'http://localhost:8001',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS) || 120000,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
    aiMax:    parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = config;