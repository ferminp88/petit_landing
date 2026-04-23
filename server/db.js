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

module.exports = db;
