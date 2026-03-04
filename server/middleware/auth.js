import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function optionalAuth(req, res, next) {
  const token = req.cookies?.dailypin_session;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.dailypin_session;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
