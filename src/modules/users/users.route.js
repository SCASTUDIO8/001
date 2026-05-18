'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const controller = require('./users.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

// All user management routes require admin
router.use(authenticate, requireRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理（管理员）
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: 用户列表（分页、搜索）
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, operator, customer] }
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 */
router.get('/', controller.list);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: 用户详情
 */
router.get('/:id', [param('id').isInt({ min: 1 })], validate, controller.get);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: 创建用户
 */
router.post(
  '/',
  [
    body('username').trim().notEmpty().isLength({ min: 3, max: 64 }),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'operator', 'customer']),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  controller.create
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: 修改用户信息
 */
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['admin', 'operator', 'customer']),
  ],
  validate,
  controller.update
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: 启用/禁用账号
 */
router.patch(
  '/:id/status',
  [param('id').isInt({ min: 1 }), body('status').isIn([0, 1])],
  validate,
  controller.setStatus
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: 删除用户
 */
router.delete('/:id', [param('id').isInt({ min: 1 })], validate, controller.remove);

/**
 * @swagger
 * /api/users/{id}/login-logs:
 *   get:
 *     tags: [Users]
 *     summary: 用户登录日志
 */
router.get('/:id/login-logs', [param('id').isInt({ min: 1 })], validate, controller.loginLogs);

module.exports = router;
