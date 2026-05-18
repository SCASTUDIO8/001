'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  type: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false,
    defaultValue: 'fixed',
    comment: 'percent=折扣, fixed=满减',
  },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'percent: 0-100, fixed: CNY amount' },
  min_order: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  valid_from: { type: DataTypes.DATE, allowNull: false },
  valid_to: { type: DataTypes.DATE, allowNull: false },
  usage_limit: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null, comment: 'null=unlimited' },
  used_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'coupons',
  indexes: [{ fields: ['code'] }, { fields: ['valid_from', 'valid_to'] }],
});

module.exports = Coupon;
