# Imagen por color e visualización de precio por talle

Fecha: 2026-05-20
Rama base: `main`

## Objetivo

Dos cambios en la ficha de producto:

1. Cada color del producto puede tener una imagen asociada opcional. Al seleccionar un color en el modal, si ese color tiene imagen propia se muestra como imagen principal; si no, se mantiene la galería general del producto.
2. El precio por talle deja de mostrarse en los botones de talle. El precio principal del modal pasa a reflejar el precio del talle seleccionado (incluido `compareAtPrice` tachado). Si no hay talle seleccionado, se muestra el precio base del producto.

## No-objetivos

- No se cambia la edición de la lista de colores (sigue siendo CSV en `color_options`).
- No se cambia el comportamiento de `ProductCard` (sigue mostrando "Desde $X" cuando hay variantes de precio).
- No se introduce galería múltiple por color (1 imagen máxima por color).

## Esquema de datos

Nueva tabla, análoga a `product_size_prices`:

```sql
CREATE TABLE IF NOT EXISTS product_color_images (
  product_id INTEGER NOT NULL,
  color_name TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  PRIMARY KEY (product_id, color_name),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

- La lista canónica de colores sigue siendo `products.color_options` (CSV).
- Esta tabla solo guarda la asociación color → URL de imagen. Un color sin fila en esta tabla no tiene imagen propia.
- No se necesita migración de datos (no había imágenes por color antes).

## API

### `GET /products` y `GET /products/:id`

Cada producto devuelve un nuevo campo:

```ts
colors: { name: string; image: string | null }[]
```

Construido recorriendo `color_options` (CSV) y haciendo LEFT JOIN con `product_color_images`. Para cada color del CSV se devuelve `{ name, image }`, con `image = null` si no hay fila asociada.

`color_options` se mantiene para compatibilidad. `variants[type='color']` se sigue devolviendo derivado del CSV.

### Admin (`POST`, `PUT /admin/products/:id`)

Aceptan opcionalmente un array:

```ts
colors?: { name: string; image?: string | null }[]
```

Comportamiento:

- Si `colors` viene en el body, sobreescribe `product_color_images` para ese producto (delete + insert por nombre normalizado).
- Los nombres deben coincidir con los del CSV `color_options`. Si llega un color que no está en el CSV, se ignora (se loggea).
- Si `image` es `null`/vacío/ausente, no se inserta fila (equivale a "sin imagen para este color").
- Si `colors` no viene en el body, no se toca la tabla (igual que `sizes`).

## Tipos frontend

`src/types/index.ts`:

```ts
export interface ProductColor {
  name: string;
  image: string | null;
}

export interface Product {
  // ...existentes
  colors?: ProductColor[];
}

export interface RawProduct {
  // ...existentes
  colors?: { name: string; image: string | null }[];
}
```

`src/lib/api.ts` mapea `raw.colors` → `Product.colors`.

## UI: ProductModal

- Estado nuevo: `selectedColor: string | null` (independiente del estado de variantes).
- Imagen principal mostrada:
  - Si hay `selectedColor` y ese color tiene `image`, se muestra esa URL.
  - Si no, se usa la galería actual (`images[currentImageIndex]`).
  - La galería de thumbnails sigue mostrando `images[]` del producto, sin alterarse al cambiar color (los thumbnails permiten "volver" a la galería).
- Selector de color: cada chip de color sigue usándose como hoy (variants), pero ahora también setea `selectedColor`.
- Precio principal del modal:
  - Si hay `selectedSize`: `price = sizes[selectedSize].price`, `compareAt = sizes[selectedSize].compareAtPrice`.
  - Si no hay talle seleccionado pero el producto tiene `sizes`: muestra `product.price` (precio base) como referencia.
  - Si no hay `sizes`: muestra `product.price` como hoy.
- Botones de talle: dejan de renderizar el `$X`. Solo muestran el nombre (S, M, L…).
- "Agregar al carrito" sigue tomando el precio efectivo (mismo cálculo que hoy en base al talle seleccionado).

## UI: AdminProductForm

Nueva sección "Colores" debajo de la actual lista de colores (CSV):

- Por cada color presente en el CSV `color_options`, se renderiza una fila editable con:
  - Nombre del color (solo lectura, derivado del CSV).
  - Campo URL de imagen (input de texto) — coherente con cómo se manejan las imágenes hoy en el form (URLs, no uploads).
  - Botón "Quitar imagen" (vacía la URL).
- Cuando el usuario edita el CSV de colores, la lista de filas se reconcilia: colores nuevos aparecen con imagen vacía; colores eliminados se descartan.
- Al guardar, se envía el array `colors: [{ name, image }]` (solo los que tienen `image` no vacío) junto al resto del FormData/JSON.

Nota: la subida de archivos de imagen está fuera de alcance de este spec. Se asume el mismo patrón URL-de-imagen que ya usa el resto del admin para el campo `image` principal y para `images[]`.

## Archivos afectados

- `server/db.js` — crear tabla `product_color_images`.
- `server/routes/admin.js` — leer/escribir `colors` en POST/PUT.
- Ruta GET pública de productos (`server/routes/products.js` o equivalente) — incluir `colors` en la respuesta.
- `src/types/index.ts` — `ProductColor`, `Product.colors`, `RawProduct.colors`.
- `src/lib/api.ts` — mapear `colors`.
- `src/components/ProductModal.tsx` — estado `selectedColor`, swap de imagen, precio principal derivado del talle, botones de talle sin precio.
- `src/admin/AdminProductForm.tsx` — fila por color con input de URL de imagen.

## Edge cases

- Producto sin `colors` ni `sizes`: comportamiento idéntico al actual.
- Color seleccionado sin imagen propia: la imagen principal queda en la galería actual; no se altera nada.
- Cambio de color con thumbnail abierto: el thumbnail seleccionado por el usuario tiene precedencia hasta que cambie de color nuevamente (al cambiar color, se resetea a la imagen del color o `images[0]`).
- Talle agotado / sin precio en `product_size_prices`: se cae al `product.price` base (igual que hoy).

## Testing manual

1. Crear producto con 3 colores (Verde, Negro, Blanco). Asignar imagen solo a Verde y Negro.
2. En el modal: seleccionar Verde → imagen Verde. Seleccionar Blanco → galería general. Seleccionar Negro → imagen Negro.
3. Crear producto con 3 talles a precios distintos. Verificar que los botones de talle no muestran precio. Seleccionar cada talle y verificar que el precio principal cambia.
4. Producto con talles y colores combinados: ambos comportamientos coexisten.
5. Admin: editar CSV de colores → la lista de filas con imagen se reconcilia.
