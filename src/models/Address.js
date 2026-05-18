'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  receiver: { type: DataTypes.STRING(64), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  province: { type: DataTypes.STRING(64), allowNull: false },
  city: { type: DataTypes.STRING(64), allowNull: false },
  detail: { type: DataTypes.STRING(255), allowNull: false },
  is_default: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'addresses',
  indexes: [{ fields: ['user_id'] }],
});

module.exports = Address;
