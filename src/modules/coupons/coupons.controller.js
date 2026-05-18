'use strict';

const { Coupon, UserCoupon } = require('../../models');
const { paginate } = require('../../utils/pagination');
const { success, created, fail, notFound } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const { limit, offset, meta } = paginate(req.query);
    const { count, rows } = await Coupon.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { code, type, value, min_order, valid_from, valid_to, usage_limit } = req.body;
    if (await Coupon.findOne({ where: { code } })) return fail(res, 'Coupon code already exists', 409);

    const coupon = await Coupon.create({
      code,
      type,
      value,
      min_order: min_order || 0,
      valid_from,
      valid_to,
      usage_limit: usage_limit || null,
    });
    return created(res, coupon);
  } catch (err) {
    next(err);
  }
}

/**
 * Claim/verify a coupon by code — assigns it to the requesting user
 */
async function verify(req, res, next) {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const coupon = await Coupon.findOne({ where: { code, status: 1 } });
    const now = new Date();
    if (!coupon || now < coupon.valid_from || now > coupon.valid_to) {
      return fail(res, 'Coupon is invalid or expired', 400);
    }

    const existing = await UserCoupon.findOne({ where: { user_id: userId, coupon_id: coupon.id } });
    if (existing) return fail(res, 'You already have this coupon', 409);

    const uc = await UserCoupon.create({ user_id: userId, coupon_id: coupon.id });
    return created(res, { ...uc.toJSON(), coupon: { code: coupon.code, type: coupon.type, value: coupon.value } }, 'Coupon claimed');
  } catch (err) {
    next(err);
  }
}

async function my(req, res, next) {
  try {
    const { limit, offset, meta } = paginate(req.query);
    const { count, rows } = await UserCoupon.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{ model: Coupon, as: 'coupon' }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return notFound(res, 'Coupon not found');
    await coupon.destroy();
    return success(res, null, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, verify, my, remove };
