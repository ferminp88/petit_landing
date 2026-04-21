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
    color_options TEXT DEFAULT '',
    size_options TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, category, image, color_options, size_options)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run('Collar de Cuero Artesanal', 'Collar de cuero genuino curtido vegetalmente con herrajes de bronce.', 4500, 'Collares', 'https://images.unsplash.com/photo-1544567821-ea219e84428c?q=80&w=800', 'Marrón, Negro, Natural', 'S, M, L');
  insert.run('Arnés Confort para Perros', 'Arnés ergonómico acolchado para caminatas cómodas.', 5800, 'Arneses', 'https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?q=80&w=800', 'Gris, Azul, Rojo', 'S, M, L, XL');
  insert.run('Collar Gato "Velvet Silk"', 'Collar de seda suave con cierre breakaway y cascabel premium.', 2500, 'Gatos', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800', 'Rosa, Dorado, Plateado', '');
}

module.exports = db;
