import { Router } from 'express';
import crypto from 'crypto';
import cron from 'node-cron';
import db from './db/index.js';
import { getDayNumber } from './utils/dailySeed.js';
import { sendReminderEmail } from './utils/email.js';
import { requireAuth } from './middleware/auth.js';

const router = Router();
const HMAC_SECRET = process.env.JWT_SECRET; // reuse JWT secret for HMAC

// Generate HMAC-signed unsubscribe token
function generateUnsubscribeToken(userId) {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(String(userId));
  return `${userId}.${hmac.digest('hex')}`;
}

// Verify HMAC-signed unsubscribe token
function verifyUnsubscribeToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const userId = parts[0];
  const expected = generateUnsubscribeToken(parseInt(userId, 10));
  if (token === expected) return parseInt(userId, 10);
  return null;
}

// POST /api/reminders/subscribe — enable reminders
router.post('/subscribe', requireAuth, (req, res) => {
  const timezone = req.body?.timezone || 'America/New_York';

  // Basic timezone validation
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return res.status(400).json({ error: 'Invalid timezone' });
  }

  db.prepare(
    'UPDATE users SET reminder_enabled = 1, reminder_timezone = ? WHERE id = ?'
  ).run(timezone, req.user.id);

  res.json({ ok: true });
});

// POST /api/reminders/unsubscribe (authenticated)
router.post('/unsubscribe', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET reminder_enabled = 0 WHERE id = ?').run(req.user.id);
  res.json({ ok: true });
});

// GET /api/reminders/unsubscribe — HMAC-signed link from email (no auth needed)
router.get('/unsubscribe', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Missing token');
  }

  const userId = verifyUnsubscribeToken(token);
  if (userId === null) {
    return res.status(400).send('Invalid unsubscribe link');
  }

  db.prepare('UPDATE users SET reminder_enabled = 0 WHERE id = ?').run(userId);

  res.send(
    '<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:60px 20px;background:#1a2332;color:#e2e8f0;">' +
    '<h1>Unsubscribed</h1><p>You will no longer receive daily reminders from DailyPin.</p>' +
    '<a href="/" style="color:#f06845;">Go to DailyPin</a></body></html>'
  );
});

// Cron job: run every hour, send reminders to users whose local time is midnight
export function startReminderCron() {
  // Run at the top of every hour
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const dayNumber = getDayNumber();

    // Get distinct timezones of subscribed users
    const timezones = db.prepare(
      'SELECT DISTINCT reminder_timezone FROM users WHERE reminder_enabled = 1'
    ).all();

    for (const { reminder_timezone: tz } of timezones) {
      try {
        // Check if the local hour in this timezone is 0 (midnight)
        const localHour = parseInt(
          new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now),
          10
        );

        if (localHour !== 0) continue;

        // Get users in this timezone who haven't been sent a reminder today
        const todayStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);

        const users = db.prepare(`
          SELECT id, email FROM users
          WHERE reminder_enabled = 1
            AND reminder_timezone = ?
            AND (last_reminder_sent IS NULL OR last_reminder_sent < ?)
        `).all(tz, todayStart);

        for (const user of users) {
          try {
            const baseUrl = process.env.BASE_URL || 'https://dailypin.net';
            const unsubToken = generateUnsubscribeToken(user.id);
            const unsubscribeUrl = `${baseUrl}/api/reminders/unsubscribe?token=${unsubToken}`;
            await sendReminderEmail(user.email, dayNumber, unsubscribeUrl);

            db.prepare(
              'UPDATE users SET last_reminder_sent = unixepoch() WHERE id = ?'
            ).run(user.id);
          } catch (err) {
            console.error(`Failed to send reminder to ${user.email}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`Error processing timezone ${tz}:`, err.message);
      }
    }
  });

  console.log('Reminder cron job started (runs every hour)');
}

export default router;
