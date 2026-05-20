const express = require('express');
const db = require('../db');

const router = express.Router();

const getSizesForProduct = db.prepare(
  'SELECT name, price, compare_at_price FROM product_size_prices WHERE product_id = ? ORDER BY name COLLATE NOCASE ASC'
);

function attachSizes(product) {
  if (!product) return product;
  return { ...product, sizes: getSizesForProduct.all(product.id) };
}

router.get('/', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC'
  ).all();
  res.json(products.map(attachSizes));
});

router.get('/:id', (req, res) => {
  const product = db.prepare(
    'SELECT * FROM products WHERE id = ? AND active = 1'
  ).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(attachSizes(product));
});

module.exports = router;
