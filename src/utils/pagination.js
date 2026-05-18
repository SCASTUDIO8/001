'use strict';

/**
 * Build pagination metadata and Sequelize limit/offset options
 */
function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 10));
  const offset = (page - 1) * pageSize;

  return {
    limit: pageSize,
    offset,
    meta: (total) => ({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }),
  };
}

module.exports = { paginate };
