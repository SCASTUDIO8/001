'use strict';

const sequelize = require('../config/database');

const User = require('./User');
const LoginLog = require('./LoginLog');
const Category = require('./Category');
const Product = require('./Product');
const Warehouse = require('./Warehouse');
const Inventory = require('./Inventory');
const InventoryLog = require('./InventoryLog');
const Address = require('./Address');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Coupon = require('./Coupon');
const UserCoupon = require('./UserCoupon');

// --- Associations ---

// User <-> LoginLog
User.hasMany(LoginLog, { foreignKey: 'user_id', as: 'loginLogs' });
LoginLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category self-reference
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User <-> Product (creator)
User.hasMany(Product, { foreignKey: 'created_by', as: 'createdProducts' });
Product.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Warehouse <-> Inventory
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id', as: 'inventories' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

Product.hasMany(Inventory, { foreignKey: 'product_id', as: 'inventories' });
Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// InventoryLog
Product.hasMany(InventoryLog, { foreignKey: 'product_id', as: 'inventoryLogs' });
InventoryLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Warehouse.hasMany(InventoryLog, { foreignKey: 'warehouse_id', as: 'inventoryLogs' });
InventoryLog.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

User.hasMany(InventoryLog, { foreignKey: 'operator_id', as: 'inventoryLogs' });
InventoryLog.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Address <-> Order
Address.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order <-> Payment
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Coupon <-> UserCoupon
Coupon.hasMany(UserCoupon, { foreignKey: 'coupon_id', as: 'userCoupons' });
UserCoupon.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

User.hasMany(UserCoupon, { foreignKey: 'user_id', as: 'userCoupons' });
UserCoupon.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  LoginLog,
  Category,
  Product,
  Warehouse,
  Inventory,
  InventoryLog,
  Address,
  Order,
  OrderItem,
  Payment,
  Coupon,
  UserCoupon,
};
