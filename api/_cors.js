const allowedOrigins = new Set([
  'https://ilyambr.me',
  'https://www.ilyambr.me',
  'https://behindthebonnet.me',
  'https://www.behindthebonnet.me',
  'http://localhost:5173',   // add any dev origins you need
  'http://127.0.0.1:5173',
]);

export function withCors(handler) {
  return async (req, res) => {
    const origin = req.headers.origin || '';
    if (allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://ilyambr.me');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    return handler(req, res);
  };
}
