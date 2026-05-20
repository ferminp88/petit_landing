const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/promotion', (req, res) => {
  const row = db.prepare('SELECT * FROM promotion WHERE id = 1 AND active = 1').get();
  if (!row) return res.json(null);
  res.json(row);
});

router.get('/announcement-bar', (req, res) => {
  const row = db.prepare('SELECT * FROM announcement_bar WHERE id = 1 AND active = 1').get();
  if (!row) return res.json(null);
  let messages = [];
  try {
    const parsed = JSON.parse(row.messages || '[]');
    if (Array.isArray(parsed)) messages = parsed.filter(x => typeof x === 'string' && x.trim());
  } catch { /* empty */ }
  if (messages.length === 0) return res.json(null);
  res.json({ messages, speed_seconds: row.speed_seconds || 30 });
});

router.get('/banners', (req, res) => {
  const rows = db.prepare(
    'SELECT id, type, title, subtitle, image, link, position FROM banners WHERE active = 1 ORDER BY position ASC, id ASC'
  ).all();
  const categories = rows.filter(b => b.type === 'category');
  const promos = rows.filter(b => b.type === 'promo');
  res.json({ categories, promos });
});

module.exports = router;
