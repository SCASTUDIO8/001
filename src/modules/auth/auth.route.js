'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 认证模块
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 用户注册
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, minLength: 6 }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 64 }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
  validate,
  controller.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 用户登录
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: 登录成功，返回 accessToken 和 refreshToken
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: 登出（黑名单当前 Token）
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: 刷新 Access Token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: 返回新 accessToken
 */
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('refreshToken is required')],
  validate,
  controller.refreshToken
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: 修改密码（需登录）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: 密码修改成功
 */
router.post(
  '/reset-password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('oldPassword is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('newPassword must be at least 6 characters'),
  ],
  validate,
  controller.resetPassword
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 获取当前用户信息
 *     responses:
 *       200:
 *         description: 当前用户信息
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
