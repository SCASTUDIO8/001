'use strict';

const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

const ACCESS_SECRET = process.env.JWT_SECRET || 'access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/**
 * Blacklist an access token until its expiry (for logout)
 */
async function blacklistToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) return;
    const redis = await getRedisClient();
    await redis.set(`bl:${token}`, '1', { EX: ttl });
  } catch {
    // ignore errors
  }
}

async function isTokenBlacklisted(token) {
  try {
    const redis = await getRedisClient();
    const val = await redis.get(`bl:${token}`);
    return val === '1';
  } catch {
    return false;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
};
