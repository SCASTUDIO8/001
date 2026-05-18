'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const controller = require('./orders.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: 客户下单模块
 */

router.use(authenticate);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: 创建订单（自动锁定库存）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id: { type: integer }
 *                     warehouse_id: { type: integer }
 *                     quantity: { type: integer, minimum: 1 }
 *               address_id: { type: integer }
 *               coupon_code: { type: string }
 *               remark: { type: string }
 */
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.product_id').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('address_id').optional().isInt({ min: 1 }),
    body('coupon_code').optional().isString(),
    body('remark').optional().isString(),
  ],
  validate,
  controller.create
);

router.get('/', controller.list);
router.get('/:id', [param('id').isInt({ min: 1 })], validate, controller.get);

router.post('/:id/cancel', [param('id').isInt({ min: 1 })], validate, controller.cancel);

/**
 * @swagger
 * /api/orders/{id}/pay:
 *   post:
 *     tags: [Orders]
 *     summary: 发起支付
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method: { type: string, enum: [wechat, alipay, balance, mock] }
 */
router.post(
  '/:id/pay',
  [param('id').isInt({ min: 1 }), body('method').optional().isIn(['wechat', 'alipay', 'balance', 'mock'])],
  validate,
  controller.pay
);

router.get('/:id/payment-status', [param('id').isInt({ min: 1 })], validate, controller.paymentStatus);

module.exports = router;
