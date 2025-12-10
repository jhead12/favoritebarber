/**
 * api/middleware/auth.js
 * JWT authentication middleware and utilities
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Hash a plain password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password with hash
 */
async function comparePasswords(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware: require authentication
 * Checks Authorization: Bearer {token} header
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ success: false, error: 'Invalid authorization header format' });
  }

  const token = parts[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = { userId: decoded.userId };
  next();
}

/**
 * Require admin: allow if the requester userId is listed in ADMIN_USER_IDS env var (comma-separated)
 * or if an admin API key header matches ADMIN_API_KEY.
 * Must be used after requireAuth so `req.user.userId` is available.
 */
function requireAdmin(req, res, next) {
  const adminApiKey = process.env.ADMIN_API_KEY || null;
  const providedKey = req.headers['x-admin-api-key'] || null;

  if (adminApiKey && providedKey && providedKey === adminApiKey) {
    return next();
  }

  const list = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (req.user && req.user.userId && list.includes(req.user.userId)) {
    return next();
  }

  return res.status(403).json({ success: false, error: 'admin_required' });
}

/**
 * Require admin or valid admin API key. Allows admin API key to be used without a JWT.
 * If `x-admin-api-key` header matches `ADMIN_API_KEY`, the request is allowed.
 * Otherwise falls back to JWT + ADMIN_USER_IDS check via `requireAuth`.
 */
function requireAdminOrAuth(req, res, next) {
  const adminApiKey = process.env.ADMIN_API_KEY || null;
  const providedKey = req.headers['x-admin-api-key'] || null;

  if (adminApiKey && providedKey && providedKey === adminApiKey) {
    // mark a synthetic user to indicate admin API key was used
    req.user = req.user || {};
    req.user.isAdminApiKey = true;
    return next();
  }

  // fallback: require JWT auth then admin user id check
  return requireAuth(req, res, () => {
    const list = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (req.user && req.user.userId && list.includes(req.user.userId)) {
      return next();
    }
    return res.status(403).json({ success: false, error: 'admin_required' });
  });
}

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  requireAdminOrAuth,
};
