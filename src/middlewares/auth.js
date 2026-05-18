'use strict';

const { verifyAccessToken, isTokenBlacklisted } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const { User } = require('../models');

/**
 * Authenticate request via Bearer JWT
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = authHeader.slice(7);

  try {
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return unauthorized(res, 'Token has been revoked');

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role', 'status'],
    });

    if (!user) return unauthorized(res, 'User not found');
    if (user.status === 0) return unauthorized(res, 'Account disabled');

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    return unauthorized(res, 'Invalid token');
  }
}

/**
 * Require specific roles (variadic)
 * Usage: requireRole('admin', 'operator')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      const { forbidden } = require('../utils/response');
      return forbidden(res, 'Insufficient permissions');
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
