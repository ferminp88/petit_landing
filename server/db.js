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

const seedProducts = [
  ['Collar de Cuero Artesanal', 'Collar de cuero genuino curtido vegetalmente con herrajes de bronce.', 4500, 'Collares', 'https://images.unsplash.com/photo-1544567821-ea219e84428c?q=80&w=800', 'Marrón, Negro, Natural', 'S, M, L'],
  ['Arnés Confort para Perros', 'Arnés ergonómico acolchado para caminatas cómodas.', 5800, 'Arneses', 'https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?q=80&w=800', 'Gris, Azul, Rojo', 'S, M, L, XL'],
  ['Collar Gato "Velvet Silk"', 'Collar de seda suave con cierre breakaway y cascabel premium.', 2500, 'Gatos', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800', 'Rosa, Dorado, Plateado', ''],
  ['Correa Trenzada Premium', 'Correa de cuero trenzado a mano, resistente y elegante. Ideal para perros medianos y grandes.', 3800, 'Correas', 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?q=80&w=800', 'Marrón, Negro, Cognac', '120cm, 150cm'],
  ['Bandana Estampada', 'Bandana de tela suave con estampados exclusivos. Se ata fácil al collar.', 1200, 'Accesorios', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800', 'Flores, Lunares, Rayas', 'Única'],
  ['Arnés Reflectante Nocturno', 'Arnés con tiras reflectantes para paseos seguros de noche. Acolchado en pecho y lomo.', 6500, 'Arneses', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800', 'Negro, Azul marino', 'S, M, L, XL'],
  ['Collar Floral Gato', 'Collar liviano con detalle floral artesanal y cierre de seguridad. Para gatos de interior.', 2200, 'Gatos', 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?q=80&w=800', 'Rosa, Lila, Blanco', ''],
  ['Mochila Transportadora', 'Mochila para llevar a tu mascota con ventanas de malla, base acolchada y bolsillos laterales.', 12500, 'Transporte', 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?q=80&w=800', 'Beige, Gris, Negro', 'S (hasta 5kg), M (hasta 8kg)'],
  ['Collar con Placa Grabada', 'Collar de nylon resistente con placa de acero inoxidable para grabar nombre y teléfono.', 3200, 'Collares', 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?q=80&w=800', 'Rojo, Azul, Verde, Negro', 'S, M, L'],
  ['Juguete Mordedor de Cuerda', 'Mordedor de cuerda de algodón natural, resistente y lavable. Ideal para jugar y limpiar dientes.', 900, 'Juguetes', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800', 'Multicolor', 'Única'],
  ['Correa Retráctil 5m', 'Correa retráctil de 5 metros con freno ergonómico y mosquetón giratorio. Liviana y resistente.', 4200, 'Correas', 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=800', 'Negro, Azul, Rosa', 'Hasta 20kg, Hasta 40kg'],
  ['Cama Donut Luxury', 'Cama redonda de felpa ultra suave con bordes elevados para que tu mascota descanse enrollada.', 8900, 'Descanso', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800', 'Gris, Beige, Marrón', 'S (40cm), M (60cm), L (80cm)'],
  ['Comedero Antideslizante', 'Set de dos comederos de acero inoxidable con base de silicona antideslizante y soporte elevado.', 3500, 'Alimentación', 'https://images.unsplash.com/photo-1601758177266-bc599de87707?q=80&w=800', 'Plateado, Dorado', 'S, M, L'],
];

const insertIfNotExists = db.prepare(`
  INSERT INTO products (name, description, price, category, image, color_options, size_options)
  SELECT ?, ?, ?, ?, ?, ?, ?
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = ?)
`);

for (const p of seedProducts) {
  insertIfNotExists.run(...p, p[0]);
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
