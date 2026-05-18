'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryLog = sequelize.define('InventoryLog', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  change_type: {
    type: DataTypes.ENUM('in', 'out', 'adjust', 'lock', 'unlock'),
    allowNull: false,
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  remark: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'inventory_logs',
  updatedAt: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['operator_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = InventoryLog;
