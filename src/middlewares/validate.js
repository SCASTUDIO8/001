'use strict';

const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/**
 * Middleware to check express-validator results
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join('; ');
    return fail(res, messages, 422);
  }
  next();
}

module.exports = { validate };
