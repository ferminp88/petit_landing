const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/promotion', (req, res) => {
  const row = db.prepare('SELECT * FROM promotion WHERE id = 1 AND active = 1').get();
  if (!row) return res.json(null);
  res.json(row);
});

module.exports = router;
