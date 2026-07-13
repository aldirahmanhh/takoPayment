const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireInternalKey(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const key = header.slice(7);
  if (key !== config.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Invalid internal key' });
  }
  next();
}

module.exports = { requireAuth, requireInternalKey };
