'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(128), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  images: { type: DataTypes.JSON, allowNull: true, comment: 'Array of image URLs' },
  status: {
    type: DataTypes.ENUM('on', 'off'),
    allowNull: false,
    defaultValue: 'off',
    comment: 'on=上架, off=下架',
  },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'products',
  indexes: [
    { fields: ['sku'] },
    { fields: ['category_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Product;
