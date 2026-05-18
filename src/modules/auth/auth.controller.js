'use strict';

const { User, LoginLog } = require('../../models');
const { hashPassword, comparePassword } = require('../../utils/crypto');
const { signAccessToken, signRefreshToken, verifyRefreshToken, blacklistToken } = require('../../utils/jwt');
const { success, created, fail, unauthorized } = require('../../utils/response');

async function register(req, res, next) {
  try {
    const { username, password, phone, email } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) return fail(res, 'Username already taken', 409);

    if (email) {
      const byEmail = await User.findOne({ where: { email } });
      if (byEmail) return fail(res, 'Email already registered', 409);
    }

    const password_hash = await hashPassword(password);
    const user = await User.create({ username, password_hash, phone: phone || null, email: email || null });

    return created(res, { id: user.id, username: user.username, role: user.role }, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const device = req.headers['user-agent'] || 'unknown';

    const user = await User.findOne({ where: { username } });

    if (!user || !(await comparePassword(password, user.password_hash))) {
      if (user) {
        await LoginLog.create({ user_id: user.id, ip, device, result: 'failed' });
      }
      return unauthorized(res, 'Invalid credentials');
    }

    if (user.status === 0) return unauthorized(res, 'Account disabled');

    await LoginLog.create({ user_id: user.id, ip, device, result: 'success' });

    const payload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return success(res, { accessToken, refreshToken, user: payload }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await blacklistToken(req.token);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return unauthorized(res, 'Invalid or expired refresh token');
    }

    const user = await User.findByPk(decoded.id, { attributes: ['id', 'username', 'role', 'status'] });
    if (!user || user.status === 0) return unauthorized(res, 'User not found or disabled');

    const payload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);

    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const match = await comparePassword(oldPassword, user.password_hash);
    if (!match) return fail(res, 'Old password is incorrect', 400);

    user.password_hash = await hashPassword(newPassword);
    await user.save();

    // Revoke current token so user must re-login
    await blacklistToken(req.token);

    return success(res, null, 'Password updated. Please login again.');
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  return success(res, req.user);
}

module.exports = { register, login, logout, refreshToken, resetPassword, me };
