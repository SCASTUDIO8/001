'use strict';

const { Op } = require('sequelize');
const { Product, Category, Order, OrderItem } = require('../../models');
const { paginate } = require('../../utils/pagination');
const { success, created, fail, notFound } = require('../../utils/response');

// ---- Categories ----

async function listCategories(req, res, next) {
  try {
    const categories = await Category.findAll({
      where: { parent_id: null },
      include: [{ model: Category, as: 'children', include: [{ model: Category, as: 'children' }] }],
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, parent_id, sort_order } = req.body;
    const category = await Category.create({
      name,
      parent_id: parent_id || null,
      sort_order: sort_order || 0,
    });
    return created(res, category);
  } catch (err) {
    next(err);
  }
}

// ---- Products ----

async function list(req, res, next) {
  try {
    const { keyword, category_id, status } = req.query;
    const { limit, offset, meta } = paginate(req.query);

    const where = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (category_id) where.category_id = parseInt(category_id);
    if (status) where.status = status;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
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
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
    if (!product) return notFound(res, 'Product not found');
    return success(res, product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { sku, name, description, category_id, price, images } = req.body;
    if (await Product.findOne({ where: { sku } })) return fail(res, 'SKU already exists', 409);

    const product = await Product.create({
      sku,
      name,
      description,
      category_id: category_id || null,
      price,
      images: images || null,
      created_by: req.user.id,
    });
    return created(res, product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return notFound(res, 'Product not found');

    const fields = ['name', 'description', 'category_id', 'price', 'images'];
    fields.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

    await product.save();
    return success(res, product);
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return notFound(res, 'Product not found');

    const { status } = req.body;

    // Guard: cannot take offline if there are active orders containing this product
    if (status === 'off') {
      const activeOrderItem = await OrderItem.findOne({
        where: { product_id: product.id },
        include: [{
          model: Order,
          as: 'order',
          where: { status: { [Op.in]: ['pending', 'paid', 'processing'] } },
          required: true,
        }],
      });
      if (activeOrderItem) {
        return fail(res, 'Cannot take product offline: there are active orders containing this product', 409);
      }
    }

    product.status = status;
    await product.save();
    return success(res, { id: product.id, status: product.status });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return notFound(res, 'Product not found');
    if (product.status === 'on') return fail(res, 'Please take product offline before deleting', 400);
    await product.destroy();
    return success(res, null, 'Product deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory, list, get, create, update, setStatus, remove };
