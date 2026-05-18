'use strict';

const { serverError } = require('../utils/response');

/**
 * Global error handler middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const msg = err.errors.map((e) => e.message).join('; ');
    return res.status(422).json({ code: 422, message: msg, data: null });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ code: 409, message: 'Related resource constraint error', data: null });
  }

  return serverError(res, err.message || 'Internal server error');
}

module.exports = { errorHandler };
