'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const controller = require('./admin.orders.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: AdminOrders
 *   description: 后台订单管理
 */

router.use(authenticate, requireRole('admin', 'operator'));

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     tags: [AdminOrders]
 *     summary: 所有订单（筛选、分页）
 */
router.get('/', controller.list);

/**
 * @swagger
 * /api/admin/orders/stats:
 *   get:
 *     tags: [AdminOrders]
 *     summary: 订单统计（日/月销售额、数量）
 */
router.get('/stats', controller.stats);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     tags: [AdminOrders]
 *     summary: 更新订单状态（发货、完成等）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [processing, shipped, completed, cancelled] }
 */
router.patch(
  '/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['processing', 'shipped', 'completed', 'cancelled']),
  ],
  validate,
  controller.setStatus
);

module.exports = router;
