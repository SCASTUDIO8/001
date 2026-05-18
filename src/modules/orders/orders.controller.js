'use strict';

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../config/database');
const { Order, OrderItem, Product, Inventory, InventoryLog, Payment, Address, Coupon, UserCoupon } = require('../../models');
const { paginate } = require('../../utils/pagination');
const { success, created, fail, notFound, forbidden } = require('../../utils/response');
const { generateOrderNo } = require('../../utils/orderNo');

async function create(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { items, address_id, coupon_code, remark } = req.body;
    const userId = req.user.id;

    // Validate address ownership
    if (address_id) {
      const addr = await Address.findOne({ where: { id: address_id, user_id: userId } });
      if (!addr) { await t.rollback(); return fail(res, 'Address not found', 404); }
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.SHARE });
      if (!product || product.status !== 'on') {
        await t.rollback();
        return fail(res, `Product ${item.product_id} is not available`, 400);
      }

      // Find inventory (prefer specified warehouse, else first available)
      const invWhere = { product_id: item.product_id };
      if (item.warehouse_id) invWhere.warehouse_id = item.warehouse_id;

      const inv = await Inventory.findOne({
        where: invWhere,
        transaction: t,
        lock: t.LOCK.UPDATE,
        order: [['quantity', 'DESC']],
      });

      if (!inv) { await t.rollback(); return fail(res, `No inventory record for product ${item.product_id}`, 400); }

      const available = inv.quantity - inv.reserved_qty;
      if (available < item.quantity) {
        await t.rollback();
        return fail(res, `Insufficient stock for product "${product.name}" (available: ${available})`, 400);
      }

      // Lock inventory
      inv.reserved_qty += item.quantity;
      await inv.save({ transaction: t });

      await InventoryLog.create({
        product_id: product.id,
        warehouse_id: inv.warehouse_id,
        change_type: 'lock',
        quantity: item.quantity,
        operator_id: userId,
        remark: 'Order lock',
      }, { transaction: t });

      const subtotal = parseFloat(product.price) * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        product_id: product.id,
        warehouse_id: inv.warehouse_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal,
      });
    }

    // Apply coupon
    let discountAmount = 0;
    let couponId = null;
    if (coupon_code) {
      const coupon = await Coupon.findOne({ where: { code: coupon_code, status: 1 }, transaction: t, lock: t.LOCK.UPDATE });
      const now = new Date();
      if (!coupon || now < coupon.valid_from || now > coupon.valid_to) {
        await t.rollback(); return fail(res, 'Coupon invalid or expired', 400);
      }
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        await t.rollback(); return fail(res, 'Coupon usage limit reached', 400);
      }
      if (totalAmount < parseFloat(coupon.min_order)) {
        await t.rollback(); return fail(res, `Order must be at least ¥${coupon.min_order} to use this coupon`, 400);
      }

      const uc = await UserCoupon.findOne({ where: { user_id: userId, coupon_id: coupon.id }, transaction: t });
      if (!uc) { await t.rollback(); return fail(res, 'You do not have this coupon', 400); }
      if (uc.used_at) { await t.rollback(); return fail(res, 'Coupon already used', 400); }

      if (coupon.type === 'fixed') {
        discountAmount = Math.min(parseFloat(coupon.value), totalAmount);
      } else {
        // value is percentage off (e.g. 20 = 20% discount)
        discountAmount = parseFloat((totalAmount * parseFloat(coupon.value) / 100).toFixed(2));
      }

      coupon.used_count += 1;
      await coupon.save({ transaction: t });

      uc.used_at = new Date();
      await uc.save({ transaction: t });
      couponId = coupon.id;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    const order = await Order.create({
      order_no: generateOrderNo(),
      user_id: userId,
      total_amount: parseFloat(finalAmount.toFixed(2)),
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      coupon_id: couponId,
      address_id: address_id || null,
      remark: remark || null,
      status: 'pending',
    }, { transaction: t });

    for (const item of orderItems) {
      await OrderItem.create({ ...item, order_id: order.id }, { transaction: t });
    }

    await t.commit();
    return created(res, { order_no: order.order_no, id: order.id, total_amount: order.total_amount });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { limit, offset, meta } = paginate(req.query);
    const { status } = req.query;
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return success(res, { list: rows, ...meta(count) });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name'] }] },
        { model: Address, as: 'address' },
        { model: Payment, as: 'payments' },
      ],
    });
    if (!order) return notFound(res, 'Order not found');
    return success(res, order);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) { await t.rollback(); return notFound(res, 'Order not found'); }
    if (!['pending', 'paid'].includes(order.status)) {
      await t.rollback();
      return fail(res, `Cannot cancel order with status "${order.status}"`, 400);
    }

    // Release reserved inventory
    for (const item of order.items) {
      const inv = await Inventory.findOne({
        where: { product_id: item.product_id, warehouse_id: item.warehouse_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (inv) {
        inv.reserved_qty = Math.max(0, inv.reserved_qty - item.quantity);
        if (order.status === 'paid') {
          // If already paid, return stock too
          inv.quantity += item.quantity;
        }
        await inv.save({ transaction: t });

        await InventoryLog.create({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          change_type: 'unlock',
          quantity: item.quantity,
          operator_id: req.user.id,
          remark: 'Order cancelled',
        }, { transaction: t });
      }
    }

    order.status = 'cancelled';
    await order.save({ transaction: t });

    await t.commit();
    return success(res, { id: order.id, status: order.status });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function pay(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) { await t.rollback(); return notFound(res, 'Order not found'); }
    if (order.status !== 'pending') { await t.rollback(); return fail(res, `Order is not in pending status`, 400); }

    const method = req.body.method || 'mock';

    // Mock payment: immediately succeed
    const payment = await Payment.create({
      order_id: order.id,
      method,
      amount: order.total_amount,
      status: 'success',
      transaction_id: uuidv4(),
      paid_at: new Date(),
    }, { transaction: t });

    // Confirm stock deduction (reserved -> actual out)
    for (const item of order.items) {
      const inv = await Inventory.findOne({
        where: { product_id: item.product_id, warehouse_id: item.warehouse_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (inv) {
        inv.quantity -= item.quantity;
        inv.reserved_qty = Math.max(0, inv.reserved_qty - item.quantity);
        await inv.save({ transaction: t });

        await InventoryLog.create({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          change_type: 'out',
          quantity: item.quantity,
          operator_id: req.user.id,
          remark: `Order paid: ${order.order_no}`,
        }, { transaction: t });
      }
    }

    order.status = 'paid';
    await order.save({ transaction: t });

    await t.commit();
    return success(res, { order_no: order.order_no, status: order.status, payment_id: payment.id });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function paymentStatus(req, res, next) {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return notFound(res, 'Order not found');

    const payment = await Payment.findOne({ where: { order_id: order.id }, order: [['created_at', 'DESC']] });
    return success(res, {
      order_no: order.order_no,
      order_status: order.status,
      payment: payment || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, get, cancel, pay, paymentStatus };
