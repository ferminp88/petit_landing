const express = require('express');
const db = require('../db');

const router = express.Router();

const getSizesForProduct = db.prepare(
  'SELECT name, price, compare_at_price FROM product_size_prices WHERE product_id = ? ORDER BY name COLLATE NOCASE ASC'
);

const getColorImagesForProduct = db.prepare(
  'SELECT color_name, image_url FROM product_color_images WHERE product_id = ?'
);

function buildColors(product) {
  const names = String(product.color_options || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (names.length === 0) return [];
  const rows = getColorImagesForProduct.all(product.id);
  const map = new Map(rows.map(r => [r.color_name, r.image_url]));
  return names.map(name => ({ name, image: map.get(name) || null }));
}

function attachSizes(product) {
  if (!product) return product;
  return {
    ...product,
    sizes: getSizesForProduct.all(product.id),
    colors: buildColors(product),
  };
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
