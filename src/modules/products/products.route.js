'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const controller = require('./products.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: 商品管理
 */

// Public: list, detail, categories
router.get('/categories', controller.listCategories);
router.post(
  '/categories',
  authenticate,
  requireRole('admin', 'operator'),
  [body('name').trim().notEmpty(), body('parent_id').optional().isInt({ min: 1 }), body('sort_order').optional().isInt()],
  validate,
  controller.createCategory
);

router.get('/', controller.list);
router.get('/:id', [param('id').isInt({ min: 1 })], validate, controller.get);

// Write operations require admin/operator
router.post(
  '/',
  authenticate,
  requireRole('admin', 'operator'),
  [
    body('sku').trim().notEmpty().isLength({ max: 64 }),
    body('name').trim().notEmpty().isLength({ max: 128 }),
    body('price').isFloat({ min: 0 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('description').optional().isString(),
    body('images').optional().isArray(),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'operator'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('category_id').optional().isInt({ min: 1 }),
  ],
  validate,
  controller.update
);

/**
 * @swagger
 * /api/products/{id}/status:
 *   patch:
 *     tags: [Products]
 *     summary: 上架/下架商品
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [on, off] }
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('admin', 'operator'),
  [param('id').isInt({ min: 1 }), body('status').isIn(['on', 'off'])],
  validate,
  controller.setStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  [param('id').isInt({ min: 1 })],
  validate,
  controller.remove
);

module.exports = router;
