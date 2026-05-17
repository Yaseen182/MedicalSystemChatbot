const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { signToken } = require('../middleware/auth');

/**
 * Register a new user.
 */
const register = async ({ name, email, password }) => {
  // Check duplicate
  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
    [name, email, hash, 'user']
  );

  const user = result.rows[0];
  return { user, token: signToken(user) };
};

/**
 * Login an existing user.
 */
const login = async ({ email, password }) => {
  const result = await query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token: signToken(safeUser) };
};

/**
 * Get user profile by ID.
 */
const getProfile = async (userId) => {
  const result = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

module.exports = { register, login, getProfile };
