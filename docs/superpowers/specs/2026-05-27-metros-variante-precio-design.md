# Campo "Metros" con precio por combinación talle × metros

Fecha: 2026-05-27

## Objetivo

Agregar una segunda dimensión de variante a los productos: **Metros** (ej: 2mts, 3mts,
3,50mts), configurable desde el panel admin mediante un catálogo global (espejo del de
Talles). El precio depende de la **combinación** talle + metros (matriz completa): un
XL+2mts no cuesta lo mismo que un S+1mt.

## Decisiones de diseño

- **Modelo de precio:** matriz completa. Cada combinación tiene su precio exacto.
- **Alcance:** opcional por producto. Un producto puede tener solo talles, solo metros,
  ambos, o ninguno.
- **Catálogo de metros:** global (como `sizes`), administrado en su propia pantalla.
- **Combos faltantes:** permitidos. El admin carga solo las combinaciones válidas; las
  vacías aparecen deshabilitadas/no disponibles para el cliente.
- **Modelo de datos:** tabla unificada `product_variant_prices` keyed por
  `(product_id, size_name, meters_name)` con sentinela `''` para dimensión ausente.
  Reemplaza conceptualmente a `product_size_prices`; migración idempotente.

## Modelo de datos

```sql
CREATE TABLE meters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,            -- "2mts", "3mts", "3,50mts"
  sort_order REAL NOT NULL DEFAULT 0,  -- orden numérico
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE product_variant_prices (
  product_id INTEGER NOT NULL,
  size_name   TEXT NOT NULL DEFAULT '',  -- '' = sin talles
  meters_name TEXT NOT NULL DEFAULT '',  -- '' = sin metros
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  PRIMARY KEY (product_id, size_name, meters_name),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Migración idempotente** (vía tabla `migrations`): copiar cada fila de
`product_size_prices` → `product_variant_prices` con `meters_name=''`. La tabla
`product_size_prices` se conserva para rollback.

## Backend (API)

- CRUD catálogo metros en `admin.js`: `GET/POST/DELETE /api/admin/meters`.
  Público: `GET /api/meters`.
- Helper `attachVariants(product)` lee `product_variant_prices` y arma:
  `sizes[]`, `meters[]`, `priceMatrix[] = {size, meters, price, compareAtPrice}`,
  y `price` = mínimo precio disponible (precio "desde" para la card).
- `attachSizes` se mantiene (deriva `sizes` desde la tabla nueva) por compatibilidad.
- Write path `replaceVariantPricesForProduct(productId, rows)` en transacción
  (patrón de `replaceSizesForProduct`). POST/PUT de producto reciben la matriz JSON.

## Tipos (TS)

```ts
export interface ProductMeter { name: string; }
export interface VariantPrice {
  size: string; meters: string; price: number; compareAtPrice: number | null;
}
// Product: + meters?: ProductMeter[]; + priceMatrix?: VariantPrice[];
// RawProduct: + meters, + priceMatrix; mapProduct los mapea
```

## Admin

- `AdminMeters.tsx`: CRUD catálogo global (clon de `AdminSizes`), enlazado en `AdminShell`.
- `AdminProductForm`:
  - Selección de talles y metrajes del producto (checkboxes del catálogo).
  - Grilla de precios: matriz si hay ambas dimensiones (filas=talles, cols=metros),
    lista simple si una sola, precio único si ninguna. Celda vacía = combo no disponible.
  - Al guardar arma `priceMatrix` y lo envía en FormData (JSON).

## Cliente

- `ProductModal`: grupos de selección Talle y Metros (orden canónico). El precio se
  actualiza a la celda elegida; combos sin precio deshabilitados; "Agregar al carrito"
  habilitado solo con combinación válida.
- `selectedVariants` (`Record<string,string>`) guarda `{ Talle, Metros, Color }`.
- `CartDrawer` / `whatsapp.ts`: subtotal y mensaje usan el precio de la combinación e
  incluyen el metraje en el detalle.
