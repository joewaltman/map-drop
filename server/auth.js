import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import rateLimit from 'express-rate-limit';
import db from './db/index.js';
import { sendMagicLink } from './utils/email.js';
import { requireAuth } from './middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Rate limits for magic link requests
const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body?.email?.toLowerCase()?.trim() || 'unknown',
  message: { error: 'Too many login attempts for this email. Try again later.' },
});

const ipRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/login — send magic link
router.post('/login', ipRateLimit, emailRateLimit, async (req, res) => {
  const email = req.body?.email?.toLowerCase()?.trim();
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email address required' });
  }

  const token = nanoid(32);
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes

  db.prepare(
    'INSERT INTO auth_tokens (email, token, expires_at) VALUES (?, ?, ?)'
  ).run(email, token, expiresAt);

  const baseUrl = getBaseUrl(req);
  const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  try {
    await sendMagicLink(email, magicLinkUrl);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to send magic link:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

// GET /api/auth/verify — validate magic link token
router.get('/verify', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Missing token');
  }

  const row = db.prepare(
    'SELECT * FROM auth_tokens WHERE token = ? AND used = 0 AND expires_at > unixepoch()'
  ).get(token);

  if (!row) {
    return res.status(400).send(
      '<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:60px 20px;background:#1a2332;color:#e2e8f0;">' +
      '<h1>Link expired or already used</h1><p>Please request a new sign-in link.</p>' +
      '<a href="/" style="color:#f06845;">Go to DailyPin</a></body></html>'
    );
  }

  // Mark token as used
  db.prepare('UPDATE auth_tokens SET used = 1 WHERE id = ?').run(row.id);

  // Find or create user
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const displayName = row.email.split('@')[0];
    db.prepare(
      'INSERT INTO users (email, display_name) VALUES (?, ?)'
    ).run(row.email, displayName);
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  }

  // Create JWT
  const jwtToken = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Set httpOnly cookie
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https';
  res.cookie('dailypin_session', jwtToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  // Redirect to app
  const redirectUrl = isNewUser ? '/?newUser=1' : '/';
  res.redirect(redirectUrl);
});

// GET /api/auth/me — return current user info
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, display_name, reminder_enabled, reminder_timezone FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    reminderEnabled: !!user.reminder_enabled,
    reminderTimezone: user.reminder_timezone,
  });
});

// POST /api/auth/logout — clear session cookie
router.post('/logout', (req, res) => {
  res.clearCookie('dailypin_session', { path: '/' });
  res.json({ ok: true });
});

// PUT /api/auth/display-name — update display name
router.put('/display-name', requireAuth, (req, res) => {
  const displayName = req.body?.displayName?.trim();
  if (!displayName || displayName.length < 1 || displayName.length > 30) {
    return res.status(400).json({ error: 'Display name must be 1-30 characters' });
  }
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, req.user.id);
  res.json({ ok: true, displayName });
});

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] || req.headers.host).replace(/\/+$/, '');
  return `${proto}://${host}`;
}

export default router;
