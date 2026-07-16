const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

const resend = new Resend(config.resend.apiKey);

/**
 * Generate a 6-digit numeric OTP code.
 */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Send the registration verification OTP to a user's email via Resend.
 * @param {{ to: string, name?: string, code: string }} params
 */
const sendVerificationEmail = async ({ to, name, code }) => {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e6edf3; border-radius: 12px;">
      <h2 style="color: #22d3ee; margin-top: 0;">MedAI — Verify your email</h2>
      <p>${greeting}</p>
      <p>Thanks for creating a MedAI account. Use the verification code below to confirm your email address:</p>
      <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; text-align: center; padding: 20px; margin: 24px 0; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3); border-radius: 10px; color: #22d3ee;">
        ${code}
      </div>
      <p style="color: #94a3b8; font-size: 13px;">This code expires in ${config.resend.otpTtlMin} minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px;">MedAI — AI-powered medical assistant. This is an automated message, please do not reply.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to,
    subject: 'Your MedAI verification code',
    html,
  });

  if (error) {
    logger.error('Resend email error:', error);
    const err = new Error('Failed to send verification email');
    err.status = 502;
    throw err;
  }

  logger.info(`Verification email sent to ${to} (id: ${data?.id})`);
  return data;
};

module.exports = { generateOtp, sendVerificationEmail };
