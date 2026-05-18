'use strict';

const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const { Warehouse, Inventory, InventoryLog, Product } = require('../../models');
const { paginate } = require('../../utils/pagination');
const { success, created, fail, notFound } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const { limit, offset, meta } = paginate(req.query);
    const { count, rows } = await Warehouse.findAndCountAll({ limit, offset, order: [['id', 'ASC']] });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, location, manager_id } = req.body;
    const warehouse = await Warehouse.create({ name, location, manager_id: manager_id || null });
    return created(res, warehouse);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return notFound(res, 'Warehouse not found');
    ['name', 'location', 'manager_id'].forEach((f) => { if (req.body[f] !== undefined) warehouse[f] = req.body[f]; });
    await warehouse.save();
    return success(res, warehouse);
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return notFound(res, 'Warehouse not found');
    warehouse.status = req.body.status;
    await warehouse.save();
    return success(res, { id: warehouse.id, status: warehouse.status });
  } catch (err) {
    next(err);
  }
}

async function getInventory(req, res, next) {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return notFound(res, 'Warehouse not found');

    const { limit, offset, meta } = paginate(req.query);
    const { count, rows } = await Inventory.findAndCountAll({
      where: { warehouse_id: warehouse.id },
      include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'status'] }],
      limit,
      offset,
    });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function adjustInventory(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { product_id, warehouse_id, change_type, quantity, remark } = req.body;

    const product = await Product.findByPk(product_id);
    if (!product) { await t.rollback(); return notFound(res, 'Product not found'); }

    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse || warehouse.status === 0) { await t.rollback(); return fail(res, 'Warehouse not found or disabled', 404); }

    let inv = await Inventory.findOne({ where: { product_id, warehouse_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!inv) {
      inv = await Inventory.create({ product_id, warehouse_id, quantity: 0, reserved_qty: 0 }, { transaction: t });
    }

    if (change_type === 'in') {
      inv.quantity += quantity;
    } else if (change_type === 'out') {
      const available = inv.quantity - inv.reserved_qty;
      if (available < quantity) { await t.rollback(); return fail(res, 'Insufficient available stock', 400); }
      inv.quantity -= quantity;
    } else if (change_type === 'adjust') {
      // adjust sets absolute quantity
      if (quantity < inv.reserved_qty) { await t.rollback(); return fail(res, 'Adjusted quantity cannot be less than reserved quantity', 400); }
      inv.quantity = quantity;
    }

    await inv.save({ transaction: t });

    await InventoryLog.create({
      product_id,
      warehouse_id,
      change_type,
      quantity,
      operator_id: req.user.id,
      remark: remark || null,
    }, { transaction: t });

    await t.commit();
    return success(res, inv);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function inventoryLogs(req, res, next) {
  try {
    const { product_id, warehouse_id, change_type } = req.query;
    const { limit, offset, meta } = paginate(req.query);

    const where = {};
    if (product_id) where.product_id = parseInt(product_id);
    if (warehouse_id) where.warehouse_id = parseInt(warehouse_id);
    if (change_type) where.change_type = change_type;

    const { count, rows } = await InventoryLog.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'sku', 'name'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, setStatus, getInventory, adjustInventory, inventoryLogs };
