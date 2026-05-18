'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(128), allowNull: true, unique: true },
  role: {
    type: DataTypes.ENUM('admin', 'operator', 'customer'),
    allowNull: false,
    defaultValue: 'customer',
  },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1, comment: '1=active, 0=disabled' },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['status'] },
  ],
});

module.exports = User;
