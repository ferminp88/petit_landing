# Rediseño Petit × Sundar — Design Spec

**Fecha:** 2026-04-29
**Autor:** brainstorming session (Fermin + Claude)
**Estado:** Aprobado para implementación

## Objetivo

Adaptar la estética de Petit a la dirección visual de [sundarstore.com](https://sundarstore.com): minimal-editorial, paleta neutra cálida con acento de marca suave, tipografía mixta serif editorial + sans moderna, fotografía-céntrica. Mantener la identidad de Petit a través del logo (gradient magenta intacto) y un único acento rosado contenido.

## Alcance

**Incluye:** todos los componentes públicos
- `src/index.css` (sistema de diseño)
- `src/components/Hero.tsx`
- `src/components/Navbar.tsx`
- `src/components/ProductCard.tsx`
- `src/components/Filters.tsx`
- `src/components/ProductModal.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/Footer.tsx`

**Excluye:**
- Panel admin (`src/admin/*`)
- Lógica de negocio: API, contexto de carrito, hooks, tipos
- `DogCursor.tsx` (sin cambios)

## Sistema visual

### Paleta

Variables a definir en `@theme` de `src/index.css`:

| Token | Hex | Uso |
|---|---|---|
| `--color-bone` | `#F5F1EA` | Fondo principal de página, navbar, modales |
| `--color-sand` | `#E8DFD3` | Superficies secundarias (cards, thumbnails) |
| `--color-mocha` | `#6B5B4E` | Texto secundario, bordes sutiles, eyebrows |
| `--color-ink` | `#1A1A1A` | Texto principal, CTAs primarios, footer |
| `--color-petit` | `#E8689F` | Acento de marca contenido: hover de links, badge de carrito, CTA WhatsApp |

Se conservan `--color-brand-magenta`, `--color-brand-pink`, `--color-brand-orange` **únicamente** para `.text-gradient` y `.bg-gradient` aplicados al logo. Ningún otro componente usa estos tokens. `--color-brand-cream` y `--color-brand-dark` se eliminan o se mapean a `bone`/`ink` durante la migración.

### Tipografía

- **Fraunces** (300, 400, 500 + italic) — display serif editorial. Usada en `h1`, `h2`, nombres de producto, totales, títulos de sección.
- **Inter** (300, 400, 500, 600) — sans-serif. Cuerpo, UI, botones, labels, eyebrows en mayúsculas.

`@theme` redefine:
- `--font-display: "Fraunces", serif;`
- `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;`

Se elimina la importación de Fredoka y Montserrat. Importar Fraunces e Inter desde Google Fonts.

### Estilo base

- `body`: `bg-bone text-ink font-sans antialiased`.
- `h1-h6`: `font-display font-normal` (peso 400 por default; bold solo cuando se necesite peso visual).
- Sombras drásticas reemplazadas por bordes finos `border-mocha/10` o nada.
- Radios: estandarizar a `rounded-none`/`rounded-sm` para look editorial; mantener `rounded-full` solo en pills, badges, iconos.

## Componentes

### Hero (`Hero.tsx`)

- Fondo `bone` plano, sin gradiente radial blanco. Conservar capa de ruido SVG sutil.
- Layout responsive:
  - **Desktop:** dos columnas asimétricas (text 5/12, imagen 7/12). Texto vertical-center izquierda, imagen producto cuadrada grande derecha.
  - **Mobile:** una columna, imagen primero, texto debajo.
- Logo arriba reducido (`w-32`).
- Eyebrow "Hecho con amor" en `text-mocha` mayúsculas, ya no `text-brand-magenta`.
- Headline: `text-5xl md:text-7xl font-display`. Estructura tipo magazine; última palabra ("compañía") en `italic`.
- Sin `text-gradient` en el headline.
- Párrafo: `text-mocha font-light`.
- CTA: `bg-ink text-bone px-10 py-4 text-xs uppercase tracking-[0.2em]`. Hover: `bg-mocha`. Sin shadow rosado, sin `bg-gradient`.
- Imagen producto: placeholder cuadrado `aspect-square bg-sand` con primer producto destacado (puede ser hardcoded por ahora, lógica fuera de scope).

### Navbar (`Navbar.tsx`)

- Fondo `bg-bone/80 backdrop-blur-md border-b border-mocha/10`.
- Tres zonas:
  - **Izquierda:** logo (h-12).
  - **Centro:** links horizontales `Collares · Correas · Arneses · Ropa` en `text-xs uppercase tracking-[0.2em] text-ink`. Hover `text-petit`. Cada link con dropdown opcional (animado, ver sección 21st-magic).
  - **Derecha:** icon Instagram, icon search (placeholder visual, sin lógica), carrito.
- Mobile: menú hamburguesa abre drawer lateral con los mismos links verticales.
- Badge carrito: `bg-petit text-bone`, sin gradient.

### ProductCard (`ProductCard.tsx`)

- Contenedor de imagen: `aspect-square bg-sand rounded-none overflow-hidden`. Sin shadow.
- Hover en desktop:
  - Si `product.images.length >= 2`, crossfade entre imagen 0 y 1 (fade 400ms).
  - Botón "AGREGAR" aparece desde el borde inferior de la imagen como overlay (`bg-ink/90 text-bone`, `translate-y-full → 0`).
- Mobile: imagen sin hover state. Botón "Agregar al carrito" siempre visible debajo, estilo `border border-mocha/30 text-ink` minimal.
- Info debajo de la imagen:
  - Nombre: `font-display text-base text-ink`.
  - Categoría: eyebrow `text-[10px] uppercase tracking-[0.2em] text-mocha`.
  - Precio: `font-sans font-semibold text-sm text-ink`.
- Badge descuento (solo si `product.compareAtPrice > product.price`): top-left, `bg-petit text-bone text-[10px] px-2 py-0.5 uppercase tracking-wider`. Si el campo no existe en `Product`, queda como hook visual no activo (no se agrega al type — fuera de scope).

### Filters (`Filters.tsx`)

- Pills outline:
  - Inactivo: `border border-mocha/20 text-ink/70 bg-transparent`.
  - Activo: `bg-ink text-bone border-ink`.
- Sin `bg-gradient`, sin `shadow-brand-pink`.
- Dropdown panel: `bg-bone border border-mocha/15 rounded-sm`. Item activo: `bg-sand text-ink`, check en `text-mocha`.
- Botón "Limpiar": texto `text-mocha hover:text-ink`.

### ProductModal (`ProductModal.tsx`)

- Layout split 50/50 en desktop, vertical en mobile.
- **Izquierda (galería):**
  - Imagen principal `aspect-square bg-sand`.
  - Thumbnails verticales a la izquierda de la imagen principal (desktop) o debajo (mobile). Active: `border border-ink`. Inactive: `border border-mocha/15`.
- **Derecha (info):**
  - Categoría eyebrow `text-mocha`.
  - Nombre: `font-display text-3xl text-ink`.
  - Precio: `font-sans font-semibold text-xl text-ink`.
  - Descripción: `text-mocha font-light leading-relaxed`.
  - Selector talle/color: pills outline (mismo estilo que Filters).
  - CTA primario: `bg-ink text-bone` "Agregar al carrito".
  - CTA secundario: `border border-mocha/30 text-ink` "Consultar por WhatsApp" (si aplica).
- Cerrar: icon X arriba-derecha sin contenedor.
- Mantener scroll unificado mobile (regresión a no introducir).

### CartDrawer (`CartDrawer.tsx`)

- Drawer derecho `w-full md:w-[440px] bg-bone`.
- Header: "Tu carrito" en `font-display text-2xl`, contador en `text-mocha`. Close X.
- Items:
  - Thumbnail `w-20 aspect-square bg-sand`.
  - Nombre `font-display text-base`, talle/cantidad `text-xs text-mocha`.
  - Precio derecha en sans semibold.
  - Botones +/− y eliminar: iconos minimal `text-mocha hover:text-ink`.
- Footer del drawer:
  - Subtotal: label `text-mocha uppercase tracking-wider text-xs`, monto `font-display text-2xl text-ink`.
  - CTA WhatsApp: `bg-petit text-bone w-full py-4 uppercase tracking-[0.2em] text-xs font-semibold`. **Único uso prominente del rosa de marca.**

### Footer (`Footer.tsx`)

- Mantener fondo oscuro pero usar `bg-ink` en lugar de `brand-dark`.
- Texto `text-bone/60`.
- Headers de columna: `font-display text-sm uppercase tracking-[0.2em] text-bone`. Eliminar `underline underline-offset-8`.
- Links hover: `text-petit` (reemplaza `text-brand-magenta`).
- Iconos sociales: `bg-bone/10 hover:bg-petit`.
- Copyright en `text-bone/30 font-sans`.
- Mantiene grid 3-columnas (Ayuda ya removido en commit anterior).

## Componentes 21st-magic

Antes de implementar Navbar y ProductCard, consultar `mcp__21st-magic__21st_magic_component_inspiration` para:

1. **Animated dropdown nav** — referencia para los hovers de categoría del Navbar.
2. **Editorial product card with hover image swap** — referencia para el hover de imagen + reveal del CTA en ProductCard.

Adaptar las referencias a la paleta y tipografía de este spec; no copiar literalmente.

## Riesgos y consideraciones

- **Referencias rotas a tokens viejos:** otros archivos pueden usar `brand-cream`, `brand-dark`, `brand-magenta`, `brand-beige`, `brand-accent`, `bg-gradient`, `text-gradient`. Auditar con grep antes de eliminar tokens. Mapear `brand-cream → bone`, `brand-dark → ink`, conservar gradient solo en logo.
- **`brand-beige` y `brand-accent`** aparecen en componentes pero no están definidos en el `@theme` actual: confirmar si son typos o vienen de otra parte. Si son inválidos hoy, removerlos sin reemplazo.
- **Cambio de fuentes:** verificar carga (Google Fonts) y ajustar tracking/leading después en navegador.
- **Multi-imagen:** ProductCard depende de que `product.images` exista como array. Confirmar en `types/index.ts`; si solo hay `image` singular, el hover swap se omite (degradación graceful).
- **Sin tests visuales:** la verificación es manual en navegador (golden path: home → filtros → modal → agregar carrito → checkout WhatsApp).

## Plan de validación

Implementación en este orden, con verificación visual después de cada paso:

1. Sistema (`index.css`) + audit de tokens viejos.
2. Hero.
3. Navbar.
4. ProductCard.
5. Filters.
6. ProductModal.
7. CartDrawer.
8. Footer.
9. Pasada final navegando el flujo completo en desktop + mobile.
