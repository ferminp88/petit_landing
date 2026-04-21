const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.use(requireAuth);

router.get('/products', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products ORDER BY created_at DESC'
  ).all();
  res.json(products);
});

router.post('/products', upload.single('image'), (req, res) => {
  const { name, description, price, category, color_options, size_options } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, image, color_options, size_options)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description || '', parseInt(price), category || '', image, color_options || '', size_options || '');

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const { name, description, price, category, color_options, size_options } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : existing.image;

  if (req.file && existing.image && existing.image.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, '..', existing.image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, image=?, color_options=?, size_options=?
    WHERE id=?
  `).run(
    name || existing.name,
    description ?? existing.description,
    price ? parseInt(price) : existing.price,
    category ?? existing.category,
    image,
    color_options ?? existing.color_options,
    size_options ?? existing.size_options,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  if (existing.image && existing.image.startsWith('/uploads/')) {
    const imgPath = path.join(__dirname, '..', existing.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.patch('/products/:id/toggle', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(newActive, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
