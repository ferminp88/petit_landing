# Spec: Panel Admin + Backend API — Landing Petit

**Fecha:** 2026-04-21  
**Proyecto:** Landing_petit — tienda de accesorios para mascotas  
**Estado:** Aprobado

---

## Objetivo

Reemplazar los productos hardcodeados en `src/data/products.ts` por una base de datos real gestionada desde un panel admin simple. El cliente (dueño de la tienda) puede cargar, editar y desactivar productos con foto, descripción, precio y variantes.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (tienda) | React 19 + TypeScript + Tailwind CSS (existente) |
| Frontend (admin) | React — ruta `/admin` dentro del mismo proyecto |
| Backend | Express.js (ya instalado) |
| Base de datos | SQLite — archivo único `server/database.db` |
| Imágenes | Upload local a `server/uploads/` — servido como estático |
| Auth | JWT (24hs) — credenciales en `.env` |
| Contenedor | Docker + docker-compose |
| Proxy | nginx en VPS (configuración separada) |

---

## Modelo de datos

Tabla `products`:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | |
| `description` | TEXT | |
| `price` | INTEGER NOT NULL | En pesos enteros (ej: 4500) |
| `category` | TEXT | Texto libre, ej: "Collares" |
| `image` | TEXT | Ruta relativa, ej: `/uploads/abc123.jpg` |
| `color_options` | TEXT | Opciones separadas por coma, vacío = sin variante |
| `size_options` | TEXT | Opciones separadas por coma, vacío = sin variante |
| `active` | INTEGER | 1 = activo, 0 = inactivo. Default: 1 |
| `created_at` | TEXT | ISO 8601, generado en insert |

---

## API Endpoints

### Públicos (tienda)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/products` | Lista productos con `active = 1` |
| `GET` | `/api/products/:id` | Detalle de un producto activo |

### Privados (admin) — requieren `Authorization: Bearer <JWT>`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login → devuelve JWT |
| `GET` | `/api/admin/products` | Lista todos los productos (activos e inactivos) |
| `POST` | `/api/admin/products` | Crear producto — multipart/form-data con imagen |
| `PUT` | `/api/admin/products/:id` | Editar producto — multipart/form-data |
| `DELETE` | `/api/admin/products/:id` | Eliminar producto permanentemente |
| `PATCH` | `/api/admin/products/:id/toggle` | Alternar activo/inactivo |

---

## Autenticación

- Un solo usuario admin. Credenciales en variables de entorno.
- `POST /api/auth/login` recibe `{ username, password }`, valida contra `.env`, devuelve JWT firmado con `JWT_SECRET`.
- Expiración: 24 horas.
- El panel React guarda el token en `localStorage` bajo la key `petit_admin_token`.
- Requests privados envían `Authorization: Bearer <token>` en el header.
- Si el token falla o expira, el middleware responde 401 y el frontend redirige a `/admin/login`.

---

## Panel Admin (frontend)

### Rutas React

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin` | Redirect | Redirige a `/admin/login` o `/admin/products` según token |
| `/admin/login` | `AdminLogin` | Formulario usuario + contraseña |
| `/admin/products` | `AdminProducts` | Lista de productos con acciones |
| `/admin/products/new` | `AdminProductForm` | Formulario nuevo producto |
| `/admin/products/:id/edit` | `AdminProductForm` | Formulario editar producto |

### Funcionalidades del panel

- **Lista de productos:** tabla con foto thumbnail, nombre, categoría, precio, badge activo/inactivo, botones Editar y Eliminar.
- **Estadísticas simples:** total productos, activos, inactivos (cards en la parte superior).
- **Formulario de producto:**
  - Nombre (requerido)
  - Precio en pesos (requerido)
  - Categoría (texto libre, requerido)
  - Descripción (textarea)
  - Foto: drag & drop o click para subir — preview inmediato — máx 5MB — JPG/PNG/WEBP
  - Colores: input de texto separado por comas (ej: `Marrón, Negro, Natural`) — vacío = sin variante color
  - Talles: input de texto separado por comas (ej: `S, M, L`) — vacío = sin variante talle
- **Toggle activo/inactivo:** desde la lista sin entrar al formulario.
- **Eliminar:** confirmación simple antes de borrar.

---

## Estructura de archivos

```
Landing_petit/
├── src/
│   ├── components/          # Tienda (existente)
│   ├── admin/               # Panel admin
│   │   ├── AdminLogin.tsx
│   │   ├── AdminProducts.tsx
│   │   ├── AdminProductForm.tsx
│   │   └── adminApi.ts      # Funciones fetch hacia /api/admin/*
│   ├── hooks/
│   │   └── useAdminAuth.ts  # Hook: token, login, logout
│   ├── context/
│   │   └── CartContext.tsx  # (existente)
│   ├── data/
│   │   └── products.ts      # ELIMINADO — reemplazado por fetch a /api/products
│   └── App.tsx              # Agregar rutas /admin/*
├── server/
│   ├── index.js             # Entry point Express
│   ├── db.js                # Conexión SQLite + schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js      # Rutas públicas
│   │   └── admin.js         # Rutas privadas
│   ├── middleware/
│   │   └── auth.js          # Verificación JWT
│   └── uploads/             # Imágenes subidas (gitignored)
├── Dockerfile
├── docker-compose.yml
├── .env.example             # ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET
└── .gitignore               # Agregar server/uploads/, server/database.db, .env
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server/index.js"]
```

### docker-compose.yml

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

---

## Configuración nginx (VPS)

Agregar un server block en el VPS para este proyecto:

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

    # Para uploads de imágenes grandes
    client_max_body_size 10M;
}
```

Después de configurar el dominio, ejecutar Certbot:
```bash
certbot --nginx -d petit.com -d www.petit.com
```

---

## Variables de entorno (.env)

```env
ADMIN_USER=admin
ADMIN_PASSWORD=cambiar_esto
JWT_SECRET=una_clave_larga_y_secreta
PORT=3000
```

---

## Transformación de datos (API → componentes React)

La API devuelve productos con `color_options` y `size_options` como strings. Los componentes existentes (`ProductCard`, `ProductModal`, `CartContext`) esperan el formato `variants: [{type, options[]}]`.

Esta transformación ocurre en `src/lib/api.ts` — una función `mapProduct()` que convierte el formato de la API al tipo `Product` que usa la UI:

```ts
// color_options: "Marrón, Negro" → variants: [{type: 'color', options: ['Marrón', 'Negro']}]
function mapProduct(raw): Product {
  const variants = [];
  if (raw.color_options) variants.push({ type: 'color', options: raw.color_options.split(',').map(s => s.trim()) });
  if (raw.size_options)  variants.push({ type: 'size',  options: raw.size_options.split(',').map(s => s.trim()) });
  return { ...raw, variants };
}
```

Todos los fetch públicos pasan por esta función. Los componentes no se modifican.

---

## Lo que NO incluye esta versión

- Gestión de múltiples usuarios admin
- Sistema de órdenes / historial de pedidos (los pedidos llegan por WhatsApp)
- Pasarela de pago (checkout por WhatsApp)
- Múltiples imágenes por producto
