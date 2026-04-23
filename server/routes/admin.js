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
const MAX_IMAGES_PER_PRODUCT = 10;

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

function parseImages(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function deleteLocalUpload(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '..', imageUrl);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // non-fatal
  }
}

router.use(requireAuth);

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

router.post('/products', upload.array('images', MAX_IMAGES_PER_PRODUCT), (req, res) => {
  const name = sanitizeStr(req.body.name, 200);
  const description = sanitizeStr(req.body.description, 1000);
  const category = sanitizeStr(req.body.category, 100);
  const color_options = sanitizeStr(req.body.color_options, 300);
  const size_options = sanitizeStr(req.body.size_options, 300);
  const price = parseInt(req.body.price);

  if (!name || isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Nombre y precio válido son requeridos' });
  }

  const uploaded = (req.files || []).map(f => `/uploads/${f.filename}`);
  const images = uploaded;
  const image = images[0] || '';

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, image, images, color_options, size_options)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, price, category, image, JSON.stringify(images), color_options, size_options);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/products/:id', upload.array('images', MAX_IMAGES_PER_PRODUCT), (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const name = sanitizeStr(req.body.name, 200) || existing.name;
  const description = req.body.description !== undefined ? sanitizeStr(req.body.description, 1000) : existing.description;
  const category = req.body.category !== undefined ? sanitizeStr(req.body.category, 100) : existing.category;
  const color_options = req.body.color_options !== undefined ? sanitizeStr(req.body.color_options, 300) : existing.color_options;
  const size_options = req.body.size_options !== undefined ? sanitizeStr(req.body.size_options, 300) : existing.size_options;
  const price = req.body.price ? parseInt(req.body.price) : existing.price;

  if (isNaN(price) || price < 0) return res.status(400).json({ error: 'Precio inválido' });

  const prevImages = parseImages(existing.images);
  const kept = req.body.existing_images !== undefined
    ? parseImages(req.body.existing_images)
    : prevImages;
  const uploaded = (req.files || []).map(f => `/uploads/${f.filename}`);
  const finalImages = [...kept, ...uploaded].slice(0, MAX_IMAGES_PER_PRODUCT);
  const removed = prevImages.filter(img => !kept.includes(img));
  for (const oldUrl of removed) deleteLocalUpload(oldUrl);

  const image = finalImages[0] || '';

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, image=?, images=?, color_options=?, size_options=?
    WHERE id=?
  `).run(name, description, price, category, image, JSON.stringify(finalImages), color_options, size_options, req.params.id);

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

router.delete('/products/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const allImages = parseImages(existing.images);
  if (allImages.length === 0 && existing.image) allImages.push(existing.image);
  for (const url of allImages) deleteLocalUpload(url);

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
