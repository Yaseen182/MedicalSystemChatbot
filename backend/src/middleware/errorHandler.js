const logger = require('../utils/logger');

/**
 * Central error handler — must be registered LAST in Express.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log 5xx errors fully; 4xx are expected — just log message
  if (status >= 500) {
    logger.error(`${req.method} ${req.path} — ${message}`, err);
  } else {
    logger.warn(`${req.method} ${req.path} — ${status}: ${message}`);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Catch-all for unmatched routes.
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFound };
