const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const config  = require('./config');
const logger  = require('./utils/logger');

const { apiLimiter }             = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes      = require('./routes/auth');
const chatRoutes      = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ──────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── Global rate limiter ──────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
);

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin',     adminRoutes);

// ── 404 & error handlers ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
