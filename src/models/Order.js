'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  coupon_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  address_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  remark: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['order_no'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Order;
