'use strict';

const { Op } = require('sequelize');
const { User, LoginLog } = require('../../models');
const { hashPassword } = require('../../utils/crypto');
const { paginate } = require('../../utils/pagination');
const { success, created, fail, notFound } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const { keyword, role, status } = req.query;
    const { limit, offset, meta } = paginate(req.query);

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (role) where.role = role;
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return notFound(res, 'User not found');
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { username, password, phone, email, role } = req.body;

    if (await User.findOne({ where: { username } })) return fail(res, 'Username already taken', 409);
    if (email && await User.findOne({ where: { email } })) return fail(res, 'Email already registered', 409);

    const user = await User.create({
      username,
      password_hash: await hashPassword(password),
      phone: phone || null,
      email: email || null,
      role: role || 'customer',
    });

    return created(res, { id: user.id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return notFound(res, 'User not found');

    const { phone, email, role } = req.body;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) {
      if (email) {
        const existing = await User.findOne({ where: { email } });
        if (existing && existing.id !== user.id) return fail(res, 'Email already registered', 409);
      }
      user.email = email || null;
    }
    if (role !== undefined) user.role = role;

    await user.save();
    const { password_hash, ...data } = user.toJSON();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return notFound(res, 'User not found');
    user.status = req.body.status;
    await user.save();
    return success(res, { id: user.id, status: user.status });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return notFound(res, 'User not found');
    await user.destroy();
    return success(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
}

async function loginLogs(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return notFound(res, 'User not found');

    const { limit, offset, meta } = paginate(req.query);
    const { count, rows } = await LoginLog.findAndCountAll({
      where: { user_id: user.id },
      order: [['login_time', 'DESC']],
      limit,
      offset,
    });

    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, setStatus, remove, loginLogs };
