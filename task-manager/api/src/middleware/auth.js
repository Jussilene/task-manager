// task-manager/api/src/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    let token = null;

    // 1) Tenta pelo header Authorization: Bearer <token>
    const hdr = req.get('authorization') || req.get('Authorization');
    if (hdr && /^bearer\s+/i.test(hdr)) {
      token = hdr.replace(/^bearer\s+/i, '').trim();
    }

    // 2) Se não vier no header, tenta cookie
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Aceita diferentes possíveis claims
    req.userId =
      payload.sub ||
      payload.subject ||
      payload.userId ||
      payload.id;

    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
