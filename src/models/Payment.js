'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  method: {
    type: DataTypes.ENUM('wechat', 'alipay', 'balance', 'mock'),
    allowNull: false,
    defaultValue: 'mock',
  },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  transaction_id: { type: DataTypes.STRING(128), allowNull: true, unique: true },
  paid_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'payments',
  indexes: [{ fields: ['order_id'] }, { fields: ['transaction_id'] }],
});

module.exports = Payment;
