'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const controller = require('./coupons.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: 优惠券管理
 */

router.use(authenticate);

/**
 * @swagger
 * /api/coupons/my:
 *   get:
 *     tags: [Coupons]
 *     summary: 我的优惠券
 */
router.get('/my', controller.my);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: 优惠券列表（管理员）
 */
router.get('/', requireRole('admin', 'operator'), controller.list);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: 创建优惠券（管理员）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value, valid_from, valid_to]
 *             properties:
 *               code: { type: string }
 *               type: { type: string, enum: [percent, fixed] }
 *               value: { type: number }
 *               min_order: { type: number }
 *               valid_from: { type: string, format: date-time }
 *               valid_to: { type: string, format: date-time }
 *               usage_limit: { type: integer }
 */
router.post(
  '/',
  requireRole('admin'),
  [
    body('code').trim().notEmpty().isLength({ max: 32 }),
    body('type').isIn(['percent', 'fixed']),
    body('value').isFloat({ min: 0 }),
    body('min_order').optional().isFloat({ min: 0 }),
    body('valid_from').isISO8601(),
    body('valid_to').isISO8601(),
    body('usage_limit').optional().isInt({ min: 1 }),
  ],
  validate,
  controller.create
);

/**
 * @swagger
 * /api/coupons/verify:
 *   post:
 *     tags: [Coupons]
 *     summary: 验证优惠券（领取到用户账户）
 */
router.post(
  '/verify',
  [body('code').trim().notEmpty()],
  validate,
  controller.verify
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: 删除优惠券（管理员）
 */
router.delete('/:id', requireRole('admin'), [param('id').isInt({ min: 1 })], validate, controller.remove);

module.exports = router;
