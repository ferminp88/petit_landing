# Admin Panel + Backend API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los productos hardcodeados por una API Express + SQLite y agregar un panel admin React en `/admin` para que el cliente gestione su catálogo.

**Architecture:** Express sirve el build de React como estáticos y expone `/api/*`. En desarrollo, Vite corre en el puerto por defecto y proxea `/api` a Express en el puerto 3001. En producción (Docker), Express sirve todo desde el puerto 3000.

**Tech Stack:** Express 4, better-sqlite3, jsonwebtoken, multer, react-router-dom 7, React 19, TypeScript, Tailwind CSS 4, Vite 6, Docker.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `server/db.js` | Crear | Conexión SQLite + schema + seed inicial |
| `server/index.js` | Crear | Entry point Express — monta rutas y sirve estáticos |
| `server/middleware/auth.js` | Crear | Verifica JWT en rutas privadas |
| `server/routes/auth.js` | Crear | POST /api/auth/login |
| `server/routes/products.js` | Crear | GET /api/products, GET /api/products/:id |
| `server/routes/admin.js` | Crear | CRUD admin + upload imagen (multer) |
| `src/lib/api.ts` | Crear | fetch público + mapProduct() |
| `src/admin/adminApi.ts` | Crear | fetch privado (con JWT) |
| `src/hooks/useAdminAuth.ts` | Crear | Token, login, logout |
| `src/admin/AdminLogin.tsx` | Crear | Formulario login admin |
| `src/admin/AdminProducts.tsx` | Crear | Lista de productos + toggle + eliminar |
| `src/admin/AdminProductForm.tsx` | Crear | Formulario crear/editar producto |
| `src/App.tsx` | Modificar | Agregar rutas /admin/*, fetch desde API |
| `src/main.tsx` | Modificar | Envolver con BrowserRouter |
| `vite.config.ts` | Modificar | Agregar proxy /api → localhost:3001 |
| `src/data/products.ts` | Eliminar | Reemplazado por API |
| `package.json` | Modificar | Agregar dependencias y scripts dev |
| `.env.example` | Crear | Plantilla de variables de entorno |
| `.gitignore` | Modificar | Agregar uploads/, database.db, .env |
| `Dockerfile` | Crear | Build React + serve con Express |
| `docker-compose.yml` | Crear | Servicio petit con volumes |

---

## Task 1: Dependencias + configuración base

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `.env.example`
- Create: `.env`
- Modify: `.gitignore`

- [ ] **Step 1: Instalar dependencias del servidor**

```bash
npm install better-sqlite3 jsonwebtoken multer
npm install --save-dev @types/better-sqlite3 @types/jsonwebtoken @types/multer
```

- [ ] **Step 2: Instalar react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 3: Agregar scripts de desarrollo a package.json**

Reemplazar la sección `"scripts"` en `package.json`:

```json
"scripts": {
  "dev": "concurrently \"vite --port=3000 --host=0.0.0.0\" \"node server/index.js\"",
  "dev:vite": "vite --port=3000 --host=0.0.0.0",
  "dev:server": "node server/index.js",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
},
```

Luego instalar concurrently:

```bash
npm install --save-dev concurrently
```

- [ ] **Step 4: Agregar proxy en vite.config.ts**

Reemplazar el contenido de `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
```

- [ ] **Step 5: Crear .env.example**

```env
ADMIN_USER=admin
ADMIN_PASSWORD=cambiar_esto
JWT_SECRET=una_clave_larga_y_secreta_min_32_chars
PORT=3001
```

- [ ] **Step 6: Crear .env con valores reales de desarrollo**

```env
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=dev_secret_key_solo_para_desarrollo_local
PORT=3001
```

- [ ] **Step 7: Actualizar .gitignore**

Agregar al final del `.gitignore` existente (o crearlo si no existe):

```
.env
server/uploads/
server/database.db
dist/
```

- [ ] **Step 8: Verificar instalación**

```bash
node -e "require('better-sqlite3'); require('jsonwebtoken'); require('multer'); console.log('OK')"
```

Esperado: `OK`

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.ts .env.example .gitignore
git commit -m "chore: add server deps, proxy config, env setup"
```

---

## Task 2: Base de datos SQLite

**Files:**
- Create: `server/db.js`

- [ ] **Step 1: Crear directorio server/**

```bash
mkdir -p server/uploads
```

- [ ] **Step 2: Crear server/db.js**

```js
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

// Seed solo si la tabla está vacía
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
```

- [ ] **Step 3: Verificar que la DB se crea correctamente**

```bash
node -e "const db = require('./server/db'); const p = db.prepare('SELECT * FROM products').all(); console.log(p.length, 'productos'); db.close();"
```

Esperado: `3 productos`

- [ ] **Step 4: Commit**

```bash
git add server/db.js
git commit -m "feat: SQLite database setup with products schema and seed"
```

---

## Task 3: Middleware de autenticación JWT

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Crear server/middleware/auth.js**

```js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { requireAuth };
```

- [ ] **Step 2: Verificar que el módulo carga sin errores**

```bash
node -e "require('dotenv').config(); require('./server/middleware/auth'); console.log('OK')"
```

Esperado: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: JWT auth middleware"
```

---

## Task 4: Ruta de login

**Files:**
- Create: `server/routes/auth.js`

- [ ] **Step 1: Crear server/routes/auth.js**

```js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/auth.js
git commit -m "feat: auth login route — returns JWT"
```

---

## Task 5: Rutas públicas de productos

**Files:**
- Create: `server/routes/products.js`

- [ ] **Step 1: Crear server/routes/products.js**

```js
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC'
  ).all();
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = db.prepare(
    'SELECT * FROM products WHERE id = ? AND active = 1'
  ).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/products.js
git commit -m "feat: public products routes GET / and /:id"
```

---

## Task 6: Rutas admin (CRUD + upload)

**Files:**
- Create: `server/routes/admin.js`

- [ ] **Step 1: Crear server/routes/admin.js**

```js
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

// Todos los endpoints requieren auth
router.use(requireAuth);

// GET /api/admin/products — todos (activos + inactivos)
router.get('/products', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products ORDER BY created_at DESC'
  ).all();
  res.json(products);
});

// POST /api/admin/products — crear
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

// PUT /api/admin/products/:id — editar
router.put('/products/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const { name, description, price, category, color_options, size_options } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : existing.image;

  // Borrar imagen vieja si se subió una nueva y era local
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

// DELETE /api/admin/products/:id
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

// PATCH /api/admin/products/:id/toggle
router.patch('/products/:id/toggle', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const newActive = existing.active === 1 ? 0 : 1;
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(newActive, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/admin.js
git commit -m "feat: admin CRUD routes with multer image upload"
```

---

## Task 7: Entry point Express

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Crear server/index.js**

```js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes subidas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));

// En producción: servir el build de React
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '../dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 2: Iniciar el servidor**

```bash
node server/index.js
```

Esperado: `Server running on port 3001`

- [ ] **Step 3: Probar endpoint público**

En otra terminal:

```bash
curl http://localhost:3001/api/products
```

Esperado: array JSON con 3 productos del seed.

- [ ] **Step 4: Probar login**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Esperado: `{"token":"eyJ..."}`

- [ ] **Step 5: Probar ruta protegida sin token**

```bash
curl http://localhost:3001/api/admin/products
```

Esperado: `{"error":"Token requerido"}` con status 401

- [ ] **Step 6: Commit**

```bash
git add server/index.js
git commit -m "feat: Express entry point — API routes + static serving"
```

---

## Task 8: Capa de API en el frontend

**Files:**
- Create: `src/lib/api.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Actualizar src/types/index.ts para agregar el tipo raw de la API**

Reemplazar el contenido de `src/types/index.ts`:

```ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  variants?: {
    type: 'color' | 'size';
    options: string[];
  }[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariants: Record<string, string>;
}

export type PaymentMethod = 'Transferencia' | 'Efectivo' | 'Mercado Pago';

export interface CheckoutData {
  paymentMethod: PaymentMethod;
  name: string;
  address: string;
}

// Formato que devuelve la API antes de transformar
export interface RawProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  color_options: string;
  size_options: string;
  active: number;
  created_at: string;
}
```

- [ ] **Step 2: Crear src/lib/api.ts**

```ts
import { Product, RawProduct } from '../types';

function mapProduct(raw: RawProduct): Product {
  const variants: Product['variants'] = [];
  if (raw.color_options?.trim()) {
    variants.push({ type: 'color', options: raw.color_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  if (raw.size_options?.trim()) {
    variants.push({ type: 'size', options: raw.size_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description,
    price: raw.price,
    category: raw.category,
    image: raw.image,
    variants: variants.length > 0 ? variants : undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Error cargando productos');
  const data: RawProduct[] = await res.json();
  return data.map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Producto no encontrado');
  const data: RawProduct = await res.json();
  return mapProduct(data);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts src/types/index.ts
git commit -m "feat: frontend API layer with mapProduct transformation"
```

---

## Task 9: Conectar tienda a la API (reemplazar datos estáticos)

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/data/products.ts`

- [ ] **Step 1: Reemplazar src/App.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { fetchProducts } from './lib/api';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="flex-grow">
        <Hero />

        <section id="products" className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <div className="max-w-lg space-y-2">
              <h3 className="text-4xl font-display font-bold text-brand-dark">Nuestra Colección</h3>
              <p className="text-sm text-brand-dark/60 max-w-md font-light">
                Cada pieza es seleccionada pensando en la elegancia y el bienestar de tu mascota.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                    activeCategory === category
                      ? 'bg-gradient text-white shadow-lg shadow-brand-pink/20'
                      : 'bg-black/5 text-brand-dark/60 hover:bg-black/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
            >
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Eliminar src/data/products.ts**

```bash
rm src/data/products.ts
```

- [ ] **Step 3: Iniciar servidor y Vite, verificar tienda**

Terminal 1:
```bash
node server/index.js
```

Terminal 2:
```bash
npm run dev:vite
```

Abrir `http://localhost:3000` — la tienda debe mostrar los 3 productos del seed cargados desde la API.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git rm src/data/products.ts
git commit -m "feat: store fetches products from API, remove static data"
```

---

## Task 10: Routing React + hook de autenticación admin

**Files:**
- Modify: `src/main.tsx`
- Create: `src/hooks/useAdminAuth.ts`
- Create: `src/admin/adminApi.ts`

- [ ] **Step 1: Actualizar src/main.tsx con BrowserRouter**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 2: Crear src/hooks/useAdminAuth.ts**

```ts
import { useState } from 'react';

const TOKEN_KEY = 'petit_admin_token';

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  async function login(username: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    const { token: newToken } = await res.json();
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return { token, login, logout, isAuthenticated: !!token };
}
```

- [ ] **Step 3: Crear src/admin/adminApi.ts**

```ts
import { RawProduct } from '../types';

function getToken(): string {
  return localStorage.getItem('petit_admin_token') || '';
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}` };
}

export async function adminFetchProducts(): Promise<RawProduct[]> {
  const res = await fetch('/api/admin/products', { headers: authHeaders() });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error cargando productos');
  return res.json();
}

export async function adminToggleProduct(id: number): Promise<RawProduct> {
  const res = await fetch(`/api/admin/products/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error actualizando producto');
  return res.json();
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error eliminando producto');
}

export async function adminCreateProduct(formData: FormData): Promise<RawProduct> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error creando producto');
  }
  return res.json();
}

export async function adminUpdateProduct(id: number, formData: FormData): Promise<RawProduct> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error actualizando producto');
  }
  return res.json();
}

```

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/hooks/useAdminAuth.ts src/admin/adminApi.ts
git commit -m "feat: BrowserRouter, useAdminAuth hook, adminApi functions"
```

---

## Task 11: Login del admin

**Files:**
- Create: `src/admin/AdminLogin.tsx`

- [ ] **Step 1: Crear src/admin/AdminLogin.tsx**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-brand-dark">PETIT</h1>
          <p className="text-sm text-brand-dark/50 mt-1">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-black/5 p-8 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:border-brand-magenta text-sm"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:border-brand-magenta text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient text-white rounded-xl font-bold tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/AdminLogin.tsx
git commit -m "feat: AdminLogin page"
```

---

## Task 12: Lista de productos del admin

**Files:**
- Create: `src/admin/AdminProducts.tsx`

- [ ] **Step 1: Crear src/admin/AdminProducts.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import { adminFetchProducts, adminDeleteProduct, adminToggleProduct } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { RawProduct } from '../types';

export function AdminProducts() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await adminFetchProducts();
      setProducts(data);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: number) {
    try {
      const updated = await adminToggleProduct(id);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  const total = products.length;
  const activos = products.filter(p => p.active === 1).length;
  const inactivos = total - activos;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-900 text-white flex flex-col p-4 gap-2 shrink-0">
        <div className="text-xl font-display font-bold text-pink-400 px-3 py-4 tracking-widest">PETIT</div>
        <div className="px-3 py-2 bg-pink-500 rounded-lg text-sm font-bold">📦 Productos</div>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="mt-auto px-3 py-2 text-slate-400 hover:text-white text-sm text-left transition-colors"
        >
          🚪 Salir
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Productos</h1>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 bg-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-7">
            {[
              { label: 'Total', value: total, color: 'text-slate-800' },
              { label: 'Activos', value: activos, color: 'text-green-600' },
              { label: 'Inactivos', value: inactivos, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-5 py-3 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Estado</span><span>Acciones</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No hay productos. ¡Creá el primero!
              </div>
            ) : products.map(product => (
              <div
                key={product.id}
                className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-5 py-3 border-b border-slate-50 items-center last:border-0"
              >
                <img
                  src={product.image || 'https://placehold.co/60x60/f1f5f9/94a3b8?text=?'}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-semibold text-sm text-slate-800 truncate">{product.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{product.category}</div>
                </div>
                <span className="text-sm text-slate-600">{product.category}</span>
                <span className="text-sm font-bold text-slate-800">${product.price.toLocaleString('es-AR')}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {product.active ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                    className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(product.id)}
                    className={`p-2 rounded-lg transition-colors ${product.active ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                    title={product.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/AdminProducts.tsx
git commit -m "feat: AdminProducts list with toggle and delete"
```

---

## Task 13: Formulario de producto

**Files:**
- Create: `src/admin/AdminProductForm.tsx`

- [ ] **Step 1: Crear src/admin/AdminProductForm.tsx**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct, adminFetchProducts } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { RawProduct } from '../types';

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', color_options: '', size_options: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    adminFetchProducts().then(products => {
      const product = products.find(p => p.id === parseInt(id!));
      if (!product) { navigate('/admin/products'); return; }
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        category: product.category || '',
        color_options: product.color_options || '',
        size_options: product.size_options || '',
      });
      if (product.image) setImagePreview(product.image);
    }).catch(() => navigate('/admin/products'));
  }, [id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('El precio debe ser un número'); return; }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('price', form.price);
    formData.append('category', form.category.trim());
    formData.append('color_options', form.color_options.trim());
    formData.append('size_options', form.size_options.trim());
    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEdit) {
        await adminUpdateProduct(parseInt(id!), formData);
      } else {
        await adminCreateProduct(formData);
      }
      navigate('/admin/products');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error guardando producto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-900 text-white flex flex-col p-4 gap-2 shrink-0">
        <div className="text-xl font-display font-bold text-pink-400 px-3 py-4 tracking-widest">PETIT</div>
        <div className="px-3 py-2 bg-pink-500 rounded-lg text-sm font-bold">📦 Productos</div>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="mt-auto px-3 py-2 text-slate-400 hover:text-white text-sm text-left transition-colors"
        >
          🚪 Salir
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-7 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h1>
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-slate-200 p-8 space-y-6">

            {/* Imagen */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Foto del Producto
              </label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-pink-300 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-xl mx-auto" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Arrastrá una foto o hacé click para subir</p>
                    <p className="text-xs mt-1">JPG, PNG, WEBP — máx. 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Nombre + Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="Ej: Collar de Cuero"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Precio ($) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="4500"
                  min="0"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Categoría *</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                placeholder="Ej: Collares"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 resize-none"
                placeholder="Describí el producto..."
              />
            </div>

            {/* Variantes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Colores (opcional)</label>
                <input
                  type="text"
                  value={form.color_options}
                  onChange={e => setForm(p => ({ ...p, color_options: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="Marrón, Negro, Natural"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separados por coma. Vacío = sin variante.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Talles (opcional)</label>
                <input
                  type="text"
                  value={form.size_options}
                  onChange={e => setForm(p => ({ ...p, size_options: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="S, M, L, XL"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separados por coma. Vacío = sin variante.</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-gradient text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/AdminProductForm.tsx
git commit -m "feat: AdminProductForm create and edit"
```

---

## Task 14: Rutas React — conectar todo

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Actualizar src/App.tsx con rutas de React Router**

Reemplazar el contenido completo de `src/App.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { AdminLogin } from './admin/AdminLogin';
import { AdminProducts } from './admin/AdminProducts';
import { AdminProductForm } from './admin/AdminProductForm';
import { fetchProducts } from './lib/api';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';

function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="flex-grow">
        <Hero />
        <section id="products" className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <div className="max-w-lg space-y-2">
              <h3 className="text-4xl font-display font-bold text-brand-dark">Nuestra Colección</h3>
              <p className="text-sm text-brand-dark/60 max-w-md font-light">
                Cada pieza es seleccionada pensando en la elegancia y el bienestar de tu mascota.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                    activeCategory === category
                      ? 'bg-gradient text-white shadow-lg shadow-brand-pink/20'
                      : 'bg-black/5 text-brand-dark/60 hover:bg-black/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>
      <Footer />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('petit_admin_token');
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
      <Route path="/admin/products/new" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
      <Route path="/admin/products/:id/edit" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
    </Routes>
  );
}
```

- [ ] **Step 2: Verificar la app completa en desarrollo**

Terminal 1:
```bash
node server/index.js
```

Terminal 2:
```bash
npm run dev:vite
```

Verificar en `http://localhost:3000`:
- `/` → tienda carga productos desde API
- `/admin/login` → formulario de login
- Login con `admin` / `admin123` → redirige a `/admin/products`
- Lista muestra productos con toggle y eliminar
- `/admin/products/new` → formulario con upload de imagen
- Crear producto → aparece en la tienda pública

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: React Router routes — store + admin panel complete"
```

---

## Task 15: Docker + deploy

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Crear Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server/index.js"]
```

- [ ] **Step 2: Crear docker-compose.yml**

```yaml
services:
  petit:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./server/uploads:/app/server/uploads
      - ./server/database.db:/app/server/database.db
    restart: unless-stopped
```

- [ ] **Step 3: Actualizar .env para producción en el VPS**

En el VPS, crear el archivo `.env` con:

```env
ADMIN_USER=admin
ADMIN_PASSWORD=password_seguro_aqui
JWT_SECRET=clave_muy_larga_y_aleatoria_min_32_caracteres
PORT=3000
NODE_ENV=production
```

- [ ] **Step 4: Agregar .superpowers a .gitignore**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 5: Verificar build Docker localmente (opcional)**

```bash
docker compose build
docker compose up
```

Abrir `http://localhost:3000` — debe servir la tienda completa desde Express.

- [ ] **Step 6: Configuración nginx en el VPS**

En el VPS, agregar el archivo `/etc/nginx/sites-available/petit`:

```nginx
server {
    listen 80;
    server_name petit.com www.petit.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    client_max_body_size 10M;
}
```

```bash
ln -s /etc/nginx/sites-available/petit /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Para SSL con Certbot:
```bash
certbot --nginx -d petit.com -d www.petit.com
```

- [ ] **Step 7: Commit final**

```bash
git add Dockerfile docker-compose.yml .gitignore
git commit -m "feat: Docker + docker-compose for production deploy"
```

---

## Resumen de tareas

| Task | Descripción | Archivos clave |
|---|---|---|
| 1 | Dependencias + config | `package.json`, `vite.config.ts`, `.env` |
| 2 | SQLite DB + schema + seed | `server/db.js` |
| 3 | Middleware JWT | `server/middleware/auth.js` |
| 4 | Ruta login | `server/routes/auth.js` |
| 5 | Rutas públicas | `server/routes/products.js` |
| 6 | Rutas admin + upload | `server/routes/admin.js` |
| 7 | Express entry point | `server/index.js` |
| 8 | API layer frontend | `src/lib/api.ts`, `src/types/index.ts` |
| 9 | Tienda conectada a API | `src/App.tsx` |
| 10 | Router + auth hook | `src/main.tsx`, `src/hooks/useAdminAuth.ts`, `src/admin/adminApi.ts` |
| 11 | Pantalla login | `src/admin/AdminLogin.tsx` |
| 12 | Lista de productos | `src/admin/AdminProducts.tsx` |
| 13 | Formulario producto | `src/admin/AdminProductForm.tsx` |
| 14 | Rutas React completas | `src/App.tsx` |
| 15 | Docker + nginx VPS | `Dockerfile`, `docker-compose.yml` |
