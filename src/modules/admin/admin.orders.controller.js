'use strict';

const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../../config/database');
const { Order, OrderItem, User, Product, Inventory, InventoryLog } = require('../../models');
const { paginate } = require('../../utils/pagination');
const { success, fail, notFound } = require('../../utils/response');

async function list(req, res, next) {
  try {
    const { status, user_id, order_no, start_date, end_date } = req.query;
    const { limit, offset, meta } = paginate(req.query);

    const where = {};
    if (status) where.status = status;
    if (user_id) where.user_id = parseInt(user_id);
    if (order_no) where.order_no = { [Op.like]: `%${order_no}%` };
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: OrderItem, as: 'items' },
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

async function setStatus(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) { await t.rollback(); return notFound(res, 'Order not found'); }

    const { status } = req.body;
    const validTransitions = {
      paid: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed'],
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      await t.rollback();
      return fail(res, `Cannot transition from "${order.status}" to "${status}"`, 400);
    }

    // If cancelling a paid/processing order, restore inventory
    if (status === 'cancelled' && ['paid', 'processing'].includes(order.status)) {
      for (const item of order.items) {
        const inv = await Inventory.findOne({
          where: { product_id: item.product_id, warehouse_id: item.warehouse_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (inv) {
          inv.quantity += item.quantity;
          await inv.save({ transaction: t });
          await InventoryLog.create({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            change_type: 'in',
            quantity: item.quantity,
            operator_id: req.user.id,
            remark: `Admin cancelled order: ${order.order_no}`,
          }, { transaction: t });
        }
      }
    }

    order.status = status;
    await order.save({ transaction: t });
    await t.commit();
    return success(res, { id: order.id, status: order.status });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const { period = 'day' } = req.query; // 'day' or 'month'

    const groupFormat = period === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const rows = await Order.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), groupFormat), 'period'],
        [fn('COUNT', col('id')), 'order_count'],
        [fn('SUM', col('total_amount')), 'total_sales'],
      ],
      where: {
        status: { [Op.in]: ['paid', 'processing', 'shipped', 'completed'] },
      },
      group: [literal(`DATE_FORMAT(created_at, '${groupFormat}')`)],
      order: [[literal(`DATE_FORMAT(created_at, '${groupFormat}')`), 'DESC']],
      limit: period === 'month' ? 12 : 30,
      raw: true,
    });

    return success(res, rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, setStatus, stats };
