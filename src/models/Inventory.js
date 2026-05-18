'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  reserved_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '已锁定数量' },
}, {
  tableName: 'inventory',
  indexes: [
    { unique: true, fields: ['product_id', 'warehouse_id'] },
    { fields: ['product_id'] },
    { fields: ['warehouse_id'] },
  ],
});

module.exports = Inventory;
