import { OAuth2Client } from 'google-auth-library';
import { db } from './_firebase';
import { withCors } from './_cors';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

async function fetchSetting(key) {
  const snapshot = await db.ref(`siteSettings/${key}`).get();
  return snapshot.val();
}

export default withCors(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = req.body?.token;
  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const email = normalizeEmail(payload.email);
  if (!email) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  let ownerEmail = null;
  const ownerSetting = await fetchSetting('ownerEmail');
  if (typeof ownerSetting === 'string') {
    const trimmed = normalizeEmail(ownerSetting);
    if (trimmed && trimmed !== 'n/a') ownerEmail = trimmed;
  }

  let collaborators = [];
  const collabSetting = await fetchSetting('collaborators');
  if (Array.isArray(collabSetting)) {
    collaborators = collabSetting.map(normalizeEmail);
  } else if (typeof collabSetting === 'string') {
    try {
      const parsed = JSON.parse(collabSetting);
      if (Array.isArray(parsed)) collaborators = parsed.map(normalizeEmail);
    } catch (e) {
      console.warn('Unable to parse collaborators setting', e);
    }
  }

  collaborators = collaborators.filter(Boolean);
  if (ownerEmail) collaborators = collaborators.filter((c) => c !== ownerEmail);

  const authorized =
    !ownerEmail ||
    email === ownerEmail ||
    collaborators.includes(email);

  if (!authorized) {
    res.status(403).json({ error: 'Unauthorized email' });
    return;
  }

  res.json({
    success: true,
    user: {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  });
});
