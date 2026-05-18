'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique order number: ORD + date + random suffix
 */
function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ORD${date}${suffix}`;
}

module.exports = { generateOrderNo };
