const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { signToken } = require('../middleware/auth');
const config = require('../config');
const { generateOtp, sendVerificationEmail } = require('./emailService');

/**
 * Register a new user. Creates an unverified account, generates an OTP,
 * and emails it via Resend. The user must confirm the OTP before logging in.
 */
const register = async ({ name, email, password }) => {
  // Check duplicate
  const exists = await query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0 && exists.rows[0].is_verified) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 12);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + config.resend.otpTtlMin * 60 * 1000);

  if (exists.rows.length > 0) {
    // An unverified account already exists — refresh its details + OTP.
    await query(
      `UPDATE users
         SET name = $1, password_hash = $2, otp_code = $3, otp_expires_at = $4
       WHERE email = $5`,
      [name, hash, code, expiresAt, email]
    );
  } else {
    await query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, otp_code, otp_expires_at)
       VALUES ($1, $2, $3, 'user', FALSE, $4, $5)`,
      [name, email, hash, code, expiresAt]
    );
  }

  await sendVerificationEmail({ to: email, name, code });

  return { email, message: 'A verification code has been sent to your email.' };
};

/**
 * Verify the OTP a user received by email and activate the account.
 */
const verifyOtp = async ({ email, code }) => {
  const result = await query(
    'SELECT id, name, email, role, is_verified, otp_code, otp_expires_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }

  const user = result.rows[0];

  if (user.is_verified) {
    const { otp_code, otp_expires_at, is_verified, ...safeUser } = user;
    return { user: safeUser, token: signToken(safeUser), message: 'Account already verified.' };
  }

  if (!user.otp_code || user.otp_code !== code) {
    const err = new Error('Invalid verification code');
    err.status = 400;
    throw err;
  }

  if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
    const err = new Error('Verification code has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  await query(
    'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
    [user.id]
  );

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { user: safeUser, token: signToken(safeUser), message: 'Your account has been verified successfully.' };
};

/**
 * Regenerate and re-send an OTP for an unverified account.
 */
const resendOtp = async ({ email }) => {
  const result = await query('SELECT id, name, is_verified FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }

  if (result.rows[0].is_verified) {
    const err = new Error('Account is already verified');
    err.status = 409;
    throw err;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + config.resend.otpTtlMin * 60 * 1000);

  await query(
    'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
    [code, expiresAt, result.rows[0].id]
  );

  await sendVerificationEmail({ to: email, name: result.rows[0].name, code });

  return { email, message: 'A new verification code has been sent to your email.' };
};

/**
 * Login an existing user.
 */
const login = async ({ email, password }) => {
  const result = await query(
    'SELECT id, name, email, password_hash, role, is_verified FROM users WHERE email = $1',
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

  if (!user.is_verified) {
    const err = new Error('Please verify your email before signing in.');
    err.status = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  const { password_hash, is_verified, ...safeUser } = user;
  return { user: safeUser, token: signToken(safeUser), message: 'Signed in successfully.' };
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

module.exports = { register, verifyOtp, resendOtp, login, getProfile };
