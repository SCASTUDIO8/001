'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCoupon = sequelize.define('UserCoupon', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  coupon_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  used_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
}, {
  tableName: 'user_coupons',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['coupon_id'] },
    { unique: true, fields: ['user_id', 'coupon_id'] },
  ],
});

module.exports = UserCoupon;
