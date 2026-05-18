'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  parent_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  name: { type: DataTypes.STRING(64), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'categories',
  indexes: [{ fields: ['parent_id'] }],
});

module.exports = Category;
