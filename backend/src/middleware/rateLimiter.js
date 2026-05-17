const rateLimit = require('express-rate-limit');
const config = require('../config');

/** General API limiter */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

/** Stricter limiter for AI endpoints (expensive) */
const aiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached — please wait before sending more messages.' },
});

/** Auth endpoints — prevent brute force */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts — please try again in 15 minutes.' },
});

module.exports = { apiLimiter, aiLimiter, authLimiter };
