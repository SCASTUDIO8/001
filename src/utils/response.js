'use strict';

/**
 * Standard API response helpers
 */

function success(res, data = null, message = 'success', statusCode = 200) {
  return res.status(statusCode).json({
    code: 0,
    message,
    data,
  });
}

function created(res, data = null, message = 'created') {
  return success(res, data, message, 201);
}

function fail(res, message = 'error', statusCode = 400, code = 1) {
  return res.status(statusCode).json({
    code,
    message,
    data: null,
  });
}

function notFound(res, message = 'Resource not found') {
  return fail(res, message, 404, 404);
}

function unauthorized(res, message = 'Unauthorized') {
  return fail(res, message, 401, 401);
}

function forbidden(res, message = 'Forbidden') {
  return fail(res, message, 403, 403);
}

function serverError(res, message = 'Internal server error') {
  return fail(res, message, 500, 500);
}

module.exports = { success, created, fail, notFound, unauthorized, forbidden, serverError };
