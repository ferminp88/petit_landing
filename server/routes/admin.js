const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

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
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
    }
    cb(null, true);
  },
});

function sanitizeStr(val, max = 255) {
  return String(val ?? '').trim().slice(0, max);
}

function validId(id) {
  return /^\d+$/.test(String(id));
}

router.use(requireAuth);

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

router.post('/products', upload.single('image'), (req, res) => {
  const name = sanitizeStr(req.body.name, 200);
  const description = sanitizeStr(req.body.description, 1000);
  const category = sanitizeStr(req.body.category, 100);
  const color_options = sanitizeStr(req.body.color_options, 300);
  const size_options = sanitizeStr(req.body.size_options, 300);
  const price = parseInt(req.body.price);

  if (!name || isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Nombre y precio válido son requeridos' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, image, color_options, size_options)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, price, category, image, color_options, size_options);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const name = sanitizeStr(req.body.name, 200) || existing.name;
  const description = req.body.description !== undefined ? sanitizeStr(req.body.description, 1000) : existing.description;
  const category = req.body.category !== undefined ? sanitizeStr(req.body.category, 100) : existing.category;
  const color_options = req.body.color_options !== undefined ? sanitizeStr(req.body.color_options, 300) : existing.color_options;
  const size_options = req.body.size_options !== undefined ? sanitizeStr(req.body.size_options, 300) : existing.size_options;
  const price = req.body.price ? parseInt(req.body.price) : existing.price;
  const image = req.file ? `/uploads/${req.file.filename}` : existing.image;

  if (isNaN(price) || price < 0) return res.status(400).json({ error: 'Precio inválido' });

  if (req.file && existing.image && existing.image.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, '..', existing.image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, image=?, color_options=?, size_options=?
    WHERE id=?
  `).run(name, description, price, category, image, color_options, size_options, req.params.id);

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

router.delete('/products/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

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
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(newActive, req.params.id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

module.exports = router;
