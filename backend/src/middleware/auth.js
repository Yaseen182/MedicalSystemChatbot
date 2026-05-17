const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verifies the Bearer token from the Authorization header.
 * Attaches `req.user = { id, email, role }` on success.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Only allows users with role === 'admin'.
 * Must be used after `authenticate`.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Helper — signs a JWT for a user record.
 */
const signToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

module.exports = { authenticate, requireAdmin, signToken };
