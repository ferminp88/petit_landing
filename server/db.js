const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price INTEGER NOT NULL,
    category TEXT DEFAULT '',
    image TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    color_options TEXT DEFAULT '',
    size_options TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

const cols = db.prepare("PRAGMA table_info(products)").all();
if (!cols.some(c => c.name === 'images')) {
  db.exec("ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'");
}
if (!cols.some(c => c.name === 'compare_at_price')) {
  db.exec("ALTER TABLE products ADD COLUMN compare_at_price INTEGER");
}
if (!cols.some(c => c.name === 'is_new')) {
  db.exec("ALTER TABLE products ADD COLUMN is_new INTEGER DEFAULT 0");
}
if (!cols.some(c => c.name === 'is_best_seller')) {
  db.exec("ALTER TABLE products ADD COLUMN is_best_seller INTEGER DEFAULT 0");
}

const backfillRows = db.prepare(
  "SELECT id, image FROM products WHERE (images IS NULL OR images = '' OR images = '[]') AND image != ''"
).all();
if (backfillRows.length > 0) {
  const backfillStmt = db.prepare('UPDATE products SET images = ? WHERE id = ?');
  const tx = db.transaction((rows) => {
    for (const r of rows) backfillStmt.run(JSON.stringify([r.image]), r.id);
  });
  tx(backfillRows);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS product_size_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    compare_at_price INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, name)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS product_color_images (
    product_id INTEGER NOT NULL,
    color_name TEXT NOT NULL,
    image_url  TEXT NOT NULL,
    PRIMARY KEY (product_id, color_name),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

// Catálogo global de metrajes (espejo de sizes). sort_order numérico para ordenar.
db.exec(`
  CREATE TABLE IF NOT EXISTS meters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Matriz de precios por combinación talle × metros.
// size_name='' => producto sin talles ; meters_name='' => producto sin metros.
db.exec(`
  CREATE TABLE IF NOT EXISTS product_variant_prices (
    product_id INTEGER NOT NULL,
    size_name   TEXT NOT NULL DEFAULT '',
    meters_name TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,
    compare_at_price INTEGER,
    PRIMARY KEY (product_id, size_name, meters_name),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('category', 'promo')),
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    image TEXT DEFAULT '',
    link TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS promotion (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    old_price INTEGER,
    new_price INTEGER,
    active INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

const promoExists = db.prepare("SELECT 1 FROM promotion WHERE id = 1").get();
if (!promoExists) {
  db.prepare(`INSERT INTO promotion (id, image, description, active) VALUES (1, '', '', 0)`).run();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS announcement_bar (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    messages TEXT DEFAULT '[]',
    active INTEGER DEFAULT 0,
    speed_seconds INTEGER DEFAULT 30,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

const annoExists = db.prepare("SELECT 1 FROM announcement_bar WHERE id = 1").get();
if (!annoExists) {
  db.prepare(`INSERT INTO announcement_bar (id, messages, active, speed_seconds) VALUES (1, '[]', 0, 15)`).run();
}

// Si quedo con la velocidad lenta inicial (30s), bajarla a 15s (idempotente)
const ANNO_SPEED_MIG_VERSION = 1;
const annoSpeedMigRow = db.prepare("SELECT value FROM migrations WHERE key = 'announcement_speed_bump'").get();
if (!annoSpeedMigRow || annoSpeedMigRow.value < ANNO_SPEED_MIG_VERSION) {
  db.prepare(`UPDATE announcement_bar SET speed_seconds = 15 WHERE id = 1 AND speed_seconds = 30`).run();
  db.prepare(
    "INSERT OR REPLACE INTO migrations (key, value, applied_at) VALUES ('announcement_speed_bump', ?, datetime('now'))"
  ).run(ANNO_SPEED_MIG_VERSION);
}

function parseImagesJSON(val) {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string' && x.length > 0) : [];
  } catch {
    return [];
  }
}

const DEMO_EXTRA_IMAGES_POOL = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800',
  'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?q=80&w=800',
  'https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?q=80&w=800',
  'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?q=80&w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800',
  'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?q=80&w=800',
];

const DEMO_MULTI_IMAGES_MIG_VERSION = 1;
const demoMigRow = db.prepare("SELECT value FROM migrations WHERE key = 'demo_multi_images'").get();
if (!demoMigRow || demoMigRow.value < DEMO_MULTI_IMAGES_MIG_VERSION) {
  const products = db.prepare('SELECT id, image, images FROM products').all();
  const updateStmt = db.prepare('UPDATE products SET images = ? WHERE id = ?');
  const markMigStmt = db.prepare(
    "INSERT OR REPLACE INTO migrations (key, value, applied_at) VALUES ('demo_multi_images', ?, datetime('now'))"
  );
  const demoTx = db.transaction(() => {
    for (const p of products) {
      const current = parseImagesJSON(p.images);
      if (current.length >= 2) continue;
      const own = current[0] || p.image;
      if (!own) continue;
      const available = DEMO_EXTRA_IMAGES_POOL.filter(u => u !== own);
      const start = p.id % available.length;
      const extras = [available[start % available.length], available[(start + 1) % available.length]];
      const next = [own, ...extras].slice(0, 10);
      updateStmt.run(JSON.stringify(next), p.id);
    }
    markMigStmt.run(DEMO_MULTI_IMAGES_MIG_VERSION);
  });
  demoTx();
}

// Seed inicial de productos ejemplo: DESACTIVADO.
// Antes este bloque re-insertaba productos demo si el admin los había borrado, sobreescribiendo
// su catálogo en cada deploy. Ya no se ejecuta. El admin gestiona los productos desde el panel.

// Backfill product_size_prices desde size_options CSV + price actual (idempotente)
const SIZE_PRICES_BACKFILL_VERSION = 1;
const sizePricesMigRow = db.prepare("SELECT value FROM migrations WHERE key = 'product_size_prices_backfill'").get();
if (!sizePricesMigRow || sizePricesMigRow.value < SIZE_PRICES_BACKFILL_VERSION) {
  const productsAll = db.prepare("SELECT id, price, compare_at_price, size_options FROM products").all();
  const insertSizePrice = db.prepare(
    'INSERT OR IGNORE INTO product_size_prices (product_id, name, price, compare_at_price) VALUES (?, ?, ?, ?)'
  );
  const markMig = db.prepare(
    "INSERT OR REPLACE INTO migrations (key, value, applied_at) VALUES ('product_size_prices_backfill', ?, datetime('now'))"
  );
  const tx = db.transaction(() => {
    for (const p of productsAll) {
      const names = String(p.size_options || '').split(',').map(s => s.trim()).filter(Boolean);
      for (const n of names) {
        insertSizePrice.run(p.id, n, p.price, p.compare_at_price);
      }
    }
    markMig.run(SIZE_PRICES_BACKFILL_VERSION);
  });
  tx();
}

// Backfill product_variant_prices desde product_size_prices (idempotente)
// Cada fila de talle pasa a la matriz con meters_name='' (sin metros).
const VARIANT_PRICES_BACKFILL_VERSION = 1;
const variantMigRow = db.prepare("SELECT value FROM migrations WHERE key = 'product_variant_prices_backfill'").get();
if (!variantMigRow || variantMigRow.value < VARIANT_PRICES_BACKFILL_VERSION) {
  const sizeRows = db.prepare('SELECT product_id, name, price, compare_at_price FROM product_size_prices').all();
  const insertVariant = db.prepare(
    "INSERT OR IGNORE INTO product_variant_prices (product_id, size_name, meters_name, price, compare_at_price) VALUES (?, ?, '', ?, ?)"
  );
  const markMig = db.prepare(
    "INSERT OR REPLACE INTO migrations (key, value, applied_at) VALUES ('product_variant_prices_backfill', ?, datetime('now'))"
  );
  const tx = db.transaction(() => {
    for (const r of sizeRows) {
      insertVariant.run(r.product_id, r.name, r.price, r.compare_at_price);
    }
    markMig.run(VARIANT_PRICES_BACKFILL_VERSION);
  });
  tx();
}

// Seed categorías y talles desde productos existentes (idempotente vía UNIQUE)
const SEED_CATSIZE_VERSION = 1;
const seedCatSizeRow = db.prepare("SELECT value FROM migrations WHERE key = 'seed_categories_sizes'").get();
if (!seedCatSizeRow || seedCatSizeRow.value < SEED_CATSIZE_VERSION) {
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const insertSize = db.prepare('INSERT OR IGNORE INTO sizes (name) VALUES (?)');
  const markMigStmt = db.prepare(
    "INSERT OR REPLACE INTO migrations (key, value, applied_at) VALUES ('seed_categories_sizes', ?, datetime('now'))"
  );
  const seedTx = db.transaction(() => {
    const productsAll = db.prepare("SELECT category, size_options FROM products").all();
    const catSet = new Set();
    const sizeSet = new Set();
    for (const p of productsAll) {
      const cat = (p.category || '').trim();
      if (cat) catSet.add(cat);
      const sizes = String(p.size_options || '').split(',').map(s => s.trim()).filter(Boolean);
      for (const s of sizes) sizeSet.add(s);
    }
    for (const c of catSet) insertCat.run(c);
    for (const s of sizeSet) insertSize.run(s);
    markMigStmt.run(SEED_CATSIZE_VERSION);
  });
  seedTx();
}

module.exports = db;
