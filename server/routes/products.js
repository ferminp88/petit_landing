const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC'
  ).all();
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = db.prepare(
    'SELECT * FROM products WHERE id = ? AND active = 1'
  ).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

module.exports = router;
