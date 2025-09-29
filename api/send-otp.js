import crypto from 'crypto';
import { db } from './_firebase';
import { withCors } from './_cors';
import { getTransporter } from './_email';

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function hashEmail(email) {
  return Buffer.from(normalizeEmail(email)).toString('base64url');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export default withCors(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const email = normalizeEmail(req.body?.email || '');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const record = {
    hash: hashCode(otp),
    email,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  const key = hashEmail(email);
  await db.ref(`adminOtp/${key}`).set(record);

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your ilyambr admin verification code',
      text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes. If you did not request it, you can ignore this email.`,
    });
  } catch (err) {
    console.error(err);
    await db.ref(`adminOtp/${key}`).remove();
    res.status(500).json({ error: 'Failed to send verification email' });
    return;
  }

  res.json({ success: true });
});
