import crypto from 'crypto';
import { db } from './_firebase';
import { withCors } from './_cors';

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
  const code = String(req.body?.code || '').trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  if (!/^[0-9]{6}$/.test(code)) {
    res.status(400).json({ error: 'Invalid code format' });
    return;
  }

  const key = hashEmail(email);
  const snapshot = await db.ref(`adminOtp/${key}`).get();
  if (!snapshot.exists()) {
    res.status(400).json({ error: 'Verification code not found or expired' });
    return;
  }

  const record = snapshot.val();
  if (record.email !== email) {
    res.status(400).json({ error: 'Verification mismatch' });
    return;
  }

  if (!record.expiresAt || record.expiresAt < Date.now()) {
    await db.ref(`adminOtp/${key}`).remove();
    res.status(400).json({ error: 'Verification code expired' });
    return;
  }

  if (hashCode(code) !== record.hash) {
    res.status(400).json({ error: 'Incorrect verification code' });
    return;
  }

  await db.ref(`adminOtp/${key}`).remove();
  res.json({ success: true });
});
