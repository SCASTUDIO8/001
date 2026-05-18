'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const controller = require('./warehouses.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: 仓库管理
 */

router.use(authenticate);

router.get('/', requireRole('admin', 'operator'), controller.list);

router.post(
  '/',
  requireRole('admin'),
  [body('name').trim().notEmpty(), body('location').optional().isString(), body('manager_id').optional().isInt({ min: 1 })],
  validate,
  controller.create
);

router.put(
  '/:id',
  requireRole('admin'),
  [param('id').isInt({ min: 1 }), body('name').optional().trim().notEmpty()],
  validate,
  controller.update
);

router.patch(
  '/:id/status',
  requireRole('admin'),
  [param('id').isInt({ min: 1 }), body('status').isIn([0, 1])],
  validate,
  controller.setStatus
);

/**
 * @swagger
 * /api/warehouses/{id}/inventory:
 *   get:
 *     tags: [Warehouses]
 *     summary: 查看仓库库存
 */
router.get('/:id/inventory', requireRole('admin', 'operator'), [param('id').isInt({ min: 1 })], validate, controller.getInventory);

/**
 * @swagger
 * /api/warehouses/inventory/adjust:
 *   post:
 *     tags: [Warehouses]
 *     summary: 手动调整库存（入库/出库/盘点）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, warehouse_id, change_type, quantity]
 *             properties:
 *               product_id: { type: integer }
 *               warehouse_id: { type: integer }
 *               change_type: { type: string, enum: [in, out, adjust] }
 *               quantity: { type: integer }
 *               remark: { type: string }
 */
router.post(
  '/inventory/adjust',
  requireRole('admin', 'operator'),
  [
    body('product_id').isInt({ min: 1 }),
    body('warehouse_id').isInt({ min: 1 }),
    body('change_type').isIn(['in', 'out', 'adjust']),
    body('quantity').isInt({ min: 1 }),
    body('remark').optional().isString(),
  ],
  validate,
  controller.adjustInventory
);

/**
 * @swagger
 * /api/warehouses/inventory/logs:
 *   get:
 *     tags: [Warehouses]
 *     summary: 库存变动日志
 */
router.get('/inventory/logs', requireRole('admin', 'operator'), controller.inventoryLogs);

module.exports = router;
