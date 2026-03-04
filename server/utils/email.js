import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.FROM_EMAIL || 'play@dailypin.net';

// Only initialize Resend if a real API key is configured
const resend = API_KEY && API_KEY.length > 10 ? new Resend(API_KEY) : null;

export async function sendMagicLink(email, magicLinkUrl) {
  if (!resend) {
    console.log(`[DEV] Magic link for ${email}: ${magicLinkUrl}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: `DailyPin <${FROM}>`,
    to: email,
    subject: 'Your DailyPin sign-in link',
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #1a2332; margin: 0 0 8px;">DailyPin</h1>
        <p style="color: #64748b; font-size: 16px; margin: 0 0 24px;">Click below to sign in. This link expires in 15 minutes.</p>
        <a href="${magicLinkUrl}" style="display: inline-block; background: #f06845; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">Sign in to DailyPin</a>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendReminderEmail(email, dayNumber, unsubscribeUrl) {
  if (!resend) {
    console.log(`[DEV] Reminder for ${email}: DailyPin #${dayNumber}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: `DailyPin <${FROM}>`,
    to: email,
    subject: `DailyPin #${dayNumber} is ready!`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #1a2332; margin: 0 0 8px;">DailyPin #${dayNumber}</h1>
        <p style="color: #334155; font-size: 16px; margin: 0 0 24px;">A new DailyPin puzzle just dropped. Can you beat yesterday?</p>
        <a href="https://dailypin.net" style="display: inline-block; background: #f06845; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">Play Now</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;">
        <a href="${unsubscribeUrl}" style="color: #94a3b8; font-size: 13px;">Unsubscribe from reminders</a>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}
