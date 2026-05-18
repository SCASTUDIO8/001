'use strict';

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/errorHandler');

// Routes
const authRoute = require('./modules/auth/auth.route');
const usersRoute = require('./modules/users/users.route');
const productsRoute = require('./modules/products/products.route');
const warehousesRoute = require('./modules/warehouses/warehouses.route');
const ordersRoute = require('./modules/orders/orders.route');
const adminOrdersRoute = require('./modules/admin/admin.orders.route');
const couponsRoute = require('./modules/coupons/coupons.route');

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many requests, please try again later.', data: null },
});
app.use('/api/', limiter);

// ── Swagger docs ─────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/products', productsRoute);
app.use('/api/warehouses', warehousesRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/admin/orders', adminOrdersRoute);
app.use('/api/coupons', couponsRoute);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `Route ${req.method} ${req.path} not found`, data: null });
});

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
