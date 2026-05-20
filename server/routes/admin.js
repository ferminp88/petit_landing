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
  const sizes = getSizesForProduct.all(product.id);
  const colors = buildColors(product);
  return { ...product, sizes, colors };
}

function parseColorsPayload(raw, colorFiles) {
  if (raw === undefined || raw === null || raw === '') return null;
  let arr;
  try {
    arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!Array.isArray(arr)) return null;
  const files = Array.isArray(colorFiles) ? colorFiles : [];
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const name = sanitizeStr(item.name, 50);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    let image = sanitizeStr(item.image, 500);
    const m = image.match(/^pending:(\d+)$/);
    if (m) {
      const idx = parseInt(m[1], 10);
      const file = files[idx];
      image = file ? `/uploads/${file.filename}` : '';
    }
    if (!image) continue;
    out.push({ name, image });
  }
  return out;
}

const deleteColorImagesStmt = db.prepare('DELETE FROM product_color_images WHERE product_id = ?');
const insertColorImageStmt = db.prepare(
  'INSERT INTO product_color_images (product_id, color_name, image_url) VALUES (?, ?, ?)'
);

function replaceColorImagesForProduct(productId, colors, colorOptionsCsv) {
  const allowed = new Set(
    String(colorOptionsCsv || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  );
  const tx = db.transaction(() => {
    deleteColorImagesStmt.run(productId);
    for (const c of colors) {
      if (allowed.size > 0 && !allowed.has(c.name.toLowerCase())) continue;
      insertColorImageStmt.run(productId, c.name, c.image);
    }
  });
  tx();
}

function parseSizesPayload(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  let arr;
  try {
    arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!Array.isArray(arr)) return null;
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const name = sanitizeStr(item.name, 50);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const price = parseInt(item.price);
    if (isNaN(price) || price < 0) continue;
    const compareAt = parseCompareAtPrice(item.compare_at_price ?? item.compareAtPrice);
    out.push({ name, price, compare_at_price: compareAt });
  }
  return out;
}

const deleteSizesStmt = db.prepare('DELETE FROM product_size_prices WHERE product_id = ?');
const insertSizeStmt = db.prepare(
  'INSERT INTO product_size_prices (product_id, name, price, compare_at_price) VALUES (?, ?, ?, ?)'
);

function replaceSizesForProduct(productId, sizes) {
  const tx = db.transaction(() => {
    deleteSizesStmt.run(productId);
    for (const s of sizes) {
      insertSizeStmt.run(productId, s.name, s.price, s.compare_at_price);
    }
  });
  tx();
}

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products.map(attachSizes));
});

function parseCompareAtPrice(val) {
  if (val === undefined || val === null || val === '') return null;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) return null;
  return n;
}

function parseBool01(val) {
  return val === '1' || val === 1 || val === 'true' || val === true ? 1 : 0;
}

router.post('/products', upload.fields([{ name: 'images', maxCount: MAX_IMAGES_PER_PRODUCT }, { name: 'color_images', maxCount: 50 }]), (req, res) => {
  const name = sanitizeStr(req.body.name, 200);
  const description = sanitizeStr(req.body.description, 1000);
  const category = sanitizeStr(req.body.category, 100);
  const color_options = sanitizeStr(req.body.color_options, 300);
  const size_options = sanitizeStr(req.body.size_options, 300);
  const price = parseInt(req.body.price);
  const compare_at_price = parseCompareAtPrice(req.body.compare_at_price);
  const is_new = parseBool01(req.body.is_new);
  const is_best_seller = parseBool01(req.body.is_best_seller);

  if (!name || isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Nombre y precio válido son requeridos' });
  }

  const productFiles = (req.files && req.files.images) || [];
  const colorFiles = (req.files && req.files.color_images) || [];
  const uploaded = productFiles.map(f => `/uploads/${f.filename}`);
  const images = uploaded;
  const image = images[0] || '';

  const parsedSizes = parseSizesPayload(req.body.sizes);
  const effectiveSizeOptions = parsedSizes && parsedSizes.length > 0
    ? parsedSizes.map(s => s.name).join(', ')
    : size_options;

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, image, images, color_options, size_options, compare_at_price, is_new, is_best_seller)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, price, category, image, JSON.stringify(images), color_options, effectiveSizeOptions, compare_at_price, is_new, is_best_seller);

  if (parsedSizes && parsedSizes.length > 0) {
    replaceSizesForProduct(result.lastInsertRowid, parsedSizes);
  }

  const parsedColors = parseColorsPayload(req.body.colors, colorFiles);
  if (parsedColors !== null) {
    replaceColorImagesForProduct(result.lastInsertRowid, parsedColors, color_options);
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachSizes(product));
});

router.put('/products/:id', upload.fields([{ name: 'images', maxCount: MAX_IMAGES_PER_PRODUCT }, { name: 'color_images', maxCount: 50 }]), (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const name = sanitizeStr(req.body.name, 200) || existing.name;
  const description = req.body.description !== undefined ? sanitizeStr(req.body.description, 1000) : existing.description;
  const category = req.body.category !== undefined ? sanitizeStr(req.body.category, 100) : existing.category;
  const color_options = req.body.color_options !== undefined ? sanitizeStr(req.body.color_options, 300) : existing.color_options;
  const size_options = req.body.size_options !== undefined ? sanitizeStr(req.body.size_options, 300) : existing.size_options;
  const price = req.body.price ? parseInt(req.body.price) : existing.price;
  const compare_at_price = req.body.compare_at_price !== undefined
    ? parseCompareAtPrice(req.body.compare_at_price)
    : existing.compare_at_price;
  const is_new = req.body.is_new !== undefined ? parseBool01(req.body.is_new) : existing.is_new;
  const is_best_seller = req.body.is_best_seller !== undefined ? parseBool01(req.body.is_best_seller) : existing.is_best_seller;

  if (isNaN(price) || price < 0) return res.status(400).json({ error: 'Precio inválido' });

  const prevImages = parseImages(existing.images);
  const kept = req.body.existing_images !== undefined
    ? parseImages(req.body.existing_images)
    : prevImages;
  const productFiles = (req.files && req.files.images) || [];
  const colorFiles = (req.files && req.files.color_images) || [];
  const uploaded = productFiles.map(f => `/uploads/${f.filename}`);
  const finalImages = [...kept, ...uploaded].slice(0, MAX_IMAGES_PER_PRODUCT);
  const removed = prevImages.filter(img => !kept.includes(img));
  for (const oldUrl of removed) deleteLocalUpload(oldUrl);

  const image = finalImages[0] || '';

  const parsedSizes = parseSizesPayload(req.body.sizes);
  const effectiveSizeOptions = parsedSizes
    ? (parsedSizes.length > 0 ? parsedSizes.map(s => s.name).join(', ') : '')
    : size_options;

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, image=?, images=?, color_options=?, size_options=?, compare_at_price=?, is_new=?, is_best_seller=?
    WHERE id=?
  `).run(name, description, price, category, image, JSON.stringify(finalImages), color_options, effectiveSizeOptions, compare_at_price, is_new, is_best_seller, req.params.id);

  if (parsedSizes !== null) {
    replaceSizesForProduct(parseInt(req.params.id), parsedSizes);
  }

  const parsedColors = parseColorsPayload(req.body.colors, colorFiles);
  if (parsedColors !== null) {
    replaceColorImagesForProduct(parseInt(req.params.id), parsedColors, color_options);
  }

  res.json(attachSizes(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

router.delete('/products/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const allImages = parseImages(existing.images);
  if (allImages.length === 0 && existing.image) allImages.push(existing.image);
  for (const url of allImages) deleteLocalUpload(url);

  deleteSizesStmt.run(req.params.id);
  deleteColorImagesStmt.run(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.patch('/products/:id/toggle', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(newActive, req.params.id);
  res.json(attachSizes(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

// === CATEGORÍAS ===
router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE').all());
});

router.post('/categories', (req, res) => {
  const name = sanitizeStr(req.body.name, 100);
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Esa categoría ya existe' });
    throw e;
  }
});

router.delete('/categories/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// === TALLES ===
router.get('/sizes', (req, res) => {
  res.json(db.prepare('SELECT * FROM sizes ORDER BY name COLLATE NOCASE').all());
});

router.post('/sizes', (req, res) => {
  const name = sanitizeStr(req.body.name, 50);
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const result = db.prepare('INSERT INTO sizes (name) VALUES (?)').run(name);
    res.status(201).json(db.prepare('SELECT * FROM sizes WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Ese talle ya existe' });
    throw e;
  }
});

router.delete('/sizes/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  db.prepare('DELETE FROM sizes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// === PROMOCIÓN (single row) ===
router.get('/promotion', (req, res) => {
  const row = db.prepare('SELECT * FROM promotion WHERE id = 1').get();
  res.json(row || { id: 1, image: '', description: '', old_price: null, new_price: null, active: 0 });
});

router.put('/promotion', upload.single('image'), (req, res) => {
  const description = sanitizeStr(req.body.description, 500);
  const old_price = parseCompareAtPrice(req.body.old_price);
  const new_price = parseCompareAtPrice(req.body.new_price);
  const active = req.body.active === '1' || req.body.active === 'true' || req.body.active === true ? 1 : 0;

  const existing = db.prepare('SELECT * FROM promotion WHERE id = 1').get();
  let image = existing?.image || '';

  // Si se quiere borrar la imagen sin subir una nueva
  if (req.body.clear_image === '1' && !req.file) {
    deleteLocalUpload(image);
    image = '';
  }

  if (req.file) {
    deleteLocalUpload(image);
    image = `/uploads/${req.file.filename}`;
  }

  db.prepare(`
    UPDATE promotion SET image=?, description=?, old_price=?, new_price=?, active=?, updated_at=datetime('now')
    WHERE id = 1
  `).run(image, description, old_price, new_price, active);

  res.json(db.prepare('SELECT * FROM promotion WHERE id = 1').get());
});

// === ANNOUNCEMENT BAR (single row) ===
function parseMessagesArray(raw) {
  let arr;
  try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return []; }
  if (!Array.isArray(arr)) return [];
  return arr
    .map(x => sanitizeStr(x, 200))
    .filter(Boolean)
    .slice(0, 20);
}

router.get('/announcement-bar', (req, res) => {
  const row = db.prepare('SELECT * FROM announcement_bar WHERE id = 1').get();
  res.json({
    messages: parseMessagesArray(row?.messages),
    active: row?.active === 1 ? 1 : 0,
    speed_seconds: row?.speed_seconds ?? 30,
  });
});

router.put('/announcement-bar', express.json(), (req, res) => {
  const messages = parseMessagesArray(req.body.messages);
  const active = parseBool01(req.body.active);
  let speed = parseInt(req.body.speed_seconds);
  if (!isFinite(speed) || speed < 5) speed = 30;
  if (speed > 600) speed = 600;

  db.prepare(`
    UPDATE announcement_bar
    SET messages = ?, active = ?, speed_seconds = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(JSON.stringify(messages), active, speed);

  res.json({ messages, active, speed_seconds: speed });
});

// === BANNERS ===
router.get('/banners', (req, res) => {
  const type = req.query.type;
  if (type === 'category' || type === 'promo') {
    return res.json(
      db.prepare('SELECT * FROM banners WHERE type = ? ORDER BY position ASC, id ASC').all(type)
    );
  }
  res.json(db.prepare('SELECT * FROM banners ORDER BY type, position ASC, id ASC').all());
});

router.post('/banners', upload.single('image'), (req, res) => {
  const type = String(req.body.type || '').trim();
  if (type !== 'category' && type !== 'promo') {
    return res.status(400).json({ error: 'Tipo inválido (category | promo)' });
  }
  const title = sanitizeStr(req.body.title, 100);
  const subtitle = sanitizeStr(req.body.subtitle, 200);
  const link = sanitizeStr(req.body.link, 300);
  const position = parseInt(req.body.position) || 0;
  const active = parseBool01(req.body.active);
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  if (!image) return res.status(400).json({ error: 'La imagen es requerida' });

  const result = db.prepare(`
    INSERT INTO banners (type, title, subtitle, image, link, position, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(type, title, subtitle, image, link, position, active);

  res.status(201).json(db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/banners/:id', upload.single('image'), (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });

  const title = req.body.title !== undefined ? sanitizeStr(req.body.title, 100) : existing.title;
  const subtitle = req.body.subtitle !== undefined ? sanitizeStr(req.body.subtitle, 200) : existing.subtitle;
  const link = req.body.link !== undefined ? sanitizeStr(req.body.link, 300) : existing.link;
  const position = req.body.position !== undefined ? (parseInt(req.body.position) || 0) : existing.position;
  const active = req.body.active !== undefined ? parseBool01(req.body.active) : existing.active;

  let image = existing.image;
  if (req.body.clear_image === '1' && !req.file) {
    deleteLocalUpload(image);
    image = '';
  }
  if (req.file) {
    deleteLocalUpload(image);
    image = `/uploads/${req.file.filename}`;
  }

  db.prepare(`
    UPDATE banners SET title=?, subtitle=?, image=?, link=?, position=?, active=?
    WHERE id=?
  `).run(title, subtitle, image, link, position, active, req.params.id);

  res.json(db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id));
});

router.patch('/banners/:id/toggle', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });
  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE banners SET active = ? WHERE id = ?').run(newActive, req.params.id);
  res.json(db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id));
});

router.delete('/banners/:id', (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });
  deleteLocalUpload(existing.image);
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
