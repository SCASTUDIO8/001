'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginLog = sequelize.define('LoginLog', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  device: { type: DataTypes.STRING(255), allowNull: true },
  result: { type: DataTypes.ENUM('success', 'failed'), allowNull: false, defaultValue: 'success' },
  login_time: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'login_logs',
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }, { fields: ['login_time'] }],
});

module.exports = LoginLog;
