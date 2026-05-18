'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(128), allowNull: false },
  location: { type: DataTypes.STRING(255), allowNull: true },
  manager_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1, comment: '1=active, 0=disabled' },
}, {
  tableName: 'warehouses',
});

module.exports = Warehouse;
