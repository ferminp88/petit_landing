# Rediseño Petit × Sundar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todos los componentes públicos de Petit a la estética minimal-editorial inspirada en sundarstore.com (paleta neutra cálida, tipografía mixta serif + sans, foco en producto), conservando el gradient magenta del logo y un único acento rosado contenido para la marca.

**Architecture:** Refactor solo presentacional — no se toca lógica de negocio, API, contexto de carrito, hooks, ni tipos. El sistema de diseño se centraliza en `src/index.css` con nuevos tokens (`bone`, `sand`, `mocha`, `ink`, `petit`). Tokens legacy (`brand-cream`, `brand-dark`) se mantienen como aliases internos del nuevo sistema para no romper el panel admin (fuera de scope). Tokens de gradient (`brand-magenta/pink/orange`) sobreviven solo para `.text-gradient`/`.bg-gradient` aplicados al logo.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4 (`@theme`), motion/react, lucide-react. Fuentes: Fraunces + Inter via Google Fonts.

**Verificación:** El proyecto no tiene test suite. Cada tarea termina con verificación visual manual en navegador (`npm run dev`) en desktop y mobile. El criterio de "pasa" es: el componente luce según el spec, no hay errores en consola, no hay regresiones de layout en otras secciones.

**Spec:** `docs/superpowers/specs/2026-04-29-rediseno-sundar-petit-design.md`

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/index.css` | Modify | Sistema de diseño: tokens, fuentes, base. |
| `src/components/Hero.tsx` | Modify | Hero editorial split. |
| `src/components/Navbar.tsx` | Modify | Nav minimal con links centrales. |
| `src/components/ProductCard.tsx` | Modify | Card editorial con hover image swap. |
| `src/components/Filters.tsx` | Modify | Pills outline. |
| `src/components/ProductModal.tsx` | Modify | Modal split editorial. |
| `src/components/CartDrawer.tsx` | Modify | Drawer minimal con CTA petit. |
| `src/components/Footer.tsx` | Modify | Footer ink + petit hover. |
| `src/App.tsx` | Modify | Tipografía/colores del listado y estados de loading/empty. |

Archivos **fuera de scope**: `src/admin/*`, `src/context/*`, `src/lib/*`, `src/hooks/*`, `src/types/*`, `src/components/DogCursor.tsx`.

---

## Setup

Antes de empezar, abrir un terminal aparte con `npm run dev` activo para verificación visual continua. Verificar que el dev server arranca sin errores en el estado actual.

---

### Task 1: Sistema de diseño base

Centraliza tokens y fuentes nuevas en `index.css`. Mantiene los tokens legacy como aliases para no romper admin.

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Reescribir `src/index.css`**

Reemplazar el contenido completo del archivo por:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Fraunces", ui-serif, Georgia, serif;

  --color-bone: #F5F1EA;
  --color-sand: #E8DFD3;
  --color-mocha: #6B5B4E;
  --color-ink: #1A1A1A;
  --color-petit: #E8689F;

  /* Legacy aliases - sólo para que admin (fuera de scope) siga compilando.
     No usar en componentes nuevos. */
  --color-brand-cream: #F5F1EA;
  --color-brand-dark: #1A1A1A;
  --color-brand-brown: #6B5B4E;
  --color-brand-beige: #E8DFD3;
  --color-brand-accent: #6B5B4E;

  /* Sólo se conservan para .text-gradient / .bg-gradient del logo. */
  --color-brand-magenta: #f400cf;
  --color-brand-pink: #ff004c;
  --color-brand-orange: #ff7b00;
}

@layer base {
  body {
    @apply bg-bone text-ink font-sans antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display font-normal;
  }

  .text-gradient {
    @apply bg-linear-to-r from-brand-magenta via-brand-pink to-brand-orange bg-clip-text text-transparent;
  }

  .bg-gradient {
    @apply bg-linear-to-r from-brand-magenta via-brand-pink to-brand-orange;
  }
}
```

- [ ] **Step 2: Verificar dev server compila**

Recargar el navegador. Esperado: la página carga sin errores de Tailwind. Es esperable que componentes aún luzcan "feos/mixtos" porque todavía no se actualizaron — pero NO debe haber pantalla en blanco ni errores rojos en consola del navegador.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(design): nuevo sistema de tokens bone/sand/mocha/ink/petit + tipografías Fraunces+Inter"
```

---

### Task 2: Hero editorial

**Files:**
- Modify: `src/components/Hero.tsx`

- [ ] **Step 1: Reescribir Hero**

Reemplazar el contenido completo de `src/components/Hero.tsx` por:

```tsx
import React from 'react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-bone">
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="md:col-span-5 order-2 md:order-1"
        >
          <img src="/logo.png" alt="Petit" className="w-28 h-auto mb-10" />

          <span className="block uppercase tracking-[0.25em] text-[11px] font-medium text-mocha mb-6">
            Hecho con amor
          </span>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-ink mb-8">
            accesorios para<br />
            tu <em className="italic font-light">mejor</em><br />
            <em className="italic font-light">compañía</em>
          </h1>

          <p className="text-mocha font-light text-base md:text-lg max-w-md mb-10 leading-relaxed">
            Una colección curada de collares, correas y accesorios diseñados para acompañar a quien siempre te acompaña.
          </p>

          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-3 px-9 py-4 bg-ink text-bone text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-mocha transition-colors"
          >
            Ver colección
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="md:col-span-7 order-1 md:order-2"
        >
          <div className="aspect-square w-full bg-sand overflow-hidden">
            <img
              src="/hero-product.jpg"
              alt=""
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

Nota: si `/hero-product.jpg` no existe, el `onError` lo oculta y queda el cuadrado `sand` plano — visualmente coherente como placeholder.

- [ ] **Step 2: Verificación visual**

- Recargar la home.
- Desktop: imagen a la derecha (cuadrada), texto a la izquierda en serif grande con "mejor compañía" en italic.
- Mobile: imagen arriba, texto debajo.
- Botón ink sólido, sin gradient ni shadow rosado.
- Eyebrow "Hecho con amor" en mocha (no magenta).
- Sin errores en consola.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat(hero): rediseño editorial split con Fraunces y CTA ink"
```

---

### Task 3: Navbar minimal

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Reescribir Navbar**

Reemplazar el contenido completo de `src/components/Navbar.tsx` por:

```tsx
import React, { useState } from 'react';
import { ShoppingBag, Instagram, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onCartClick: () => void;
}

const NAV_LINKS = ['Collares', 'Correas', 'Arneses', 'Ropa'];

export const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bone/85 backdrop-blur-md border-b border-mocha/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 hover:bg-sand rounded-full transition-colors md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-ink" />
            </button>
            <a
              href="#"
              onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex-shrink-0"
            >
              <img src="/logo.png" alt="Petit" className="h-12 w-auto" />
            </a>
          </div>

          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <li key={link}>
                <a
                  href={`#${link.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[11px] uppercase tracking-[0.22em] font-medium text-ink hover:text-petit transition-colors"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-1 flex-1">
            <a
              href="https://instagram.com/accesorios.petit"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex p-2 hover:bg-sand rounded-full transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-ink" />
            </a>
            <button
              className="hidden md:flex p-2 hover:bg-sand rounded-full transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-ink" />
            </button>
            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-sand rounded-full transition-colors"
              aria-label="Carrito"
            >
              <ShoppingBag className="w-5 h-5 text-ink" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 bg-petit text-bone text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[55] bg-ink/30 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 z-[60] w-[80%] max-w-xs bg-bone p-8 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <img src="/logo.png" alt="Petit" className="h-10 w-auto" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-sand rounded-full transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5 text-ink" />
                </button>
              </div>
              <ul className="space-y-6">
                {NAV_LINKS.map(link => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileOpen(false);
                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block font-display text-2xl text-ink hover:text-petit transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="https://instagram.com/accesorios.petit"
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-2 text-mocha hover:text-petit transition-colors text-xs uppercase tracking-[0.22em]"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
```

- [ ] **Step 2: Verificación visual**

- Desktop: logo izquierda, links centrados (Collares · Correas · Arneses · Ropa) en mayúsculas tracking ancho, iconos derecha.
- Hover de links cambia a color petit (rosa apagado).
- Badge de carrito en petit (no gradient).
- Mobile: aparece icono hamburguesa, abre drawer izquierdo con los mismos links.
- Sin errores en consola.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat(navbar): nav minimal con links centrales y drawer mobile"
```

---

### Task 4: ProductCard editorial

**Files:**
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Reescribir ProductCard**

Reemplazar el contenido completo de `src/components/ProductCard.tsx` por:

```tsx
import React, { useMemo } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const images = useMemo(() => {
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product.images, product.image]);

  const hasSecond = images.length >= 2;
  const primary = images[0];
  const secondary = hasSecond ? images[1] : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-sand mb-4">
        {primary && (
          <img
            src={primary}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hasSecond ? 'group-hover:opacity-0' : ''}`}
            referrerPolicy="no-referrer"
          />
        )}
        {secondary && (
          <img
            src={secondary}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="hidden md:block absolute left-4 right-4 bottom-4 py-3 bg-ink text-bone text-[10px] uppercase tracking-[0.25em] font-medium translate-y-[110%] group-hover:translate-y-0 transition-transform duration-400"
        >
          Ver producto
        </button>
      </div>

      <div className="px-1 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.22em] text-mocha">
          {product.category}
        </p>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base text-ink leading-snug">
            {product.name}
          </h3>
          <span className="font-sans font-medium text-sm text-ink whitespace-nowrap">
            ${product.price.toLocaleString('es-AR')}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="md:hidden mt-2 w-full py-2.5 border border-mocha/25 text-ink text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-ink hover:text-bone hover:border-ink transition-colors"
        >
          Ver producto
        </button>
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Verificación visual**

- Cards en grid: imagen cuadrada `sand`, sin shadow ni rounded.
- Desktop hover: si el producto tiene 2+ imágenes, crossfade a la segunda; aparece botón "Ver producto" deslizando desde abajo.
- Mobile: botón siempre visible, outline mocha.
- Categoría arriba en mocha (eyebrow), nombre serif, precio sans semibold a la derecha.
- Click en cualquier parte abre el modal (comportamiento original).

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "feat(product-card): card editorial con hover image swap y CTA reveal"
```

---

### Task 5: Filters pills outline

**Files:**
- Modify: `src/components/Filters.tsx:24-78` (componente `Dropdown`) y `Filters.tsx:138-147` (botón limpiar)

- [ ] **Step 1: Actualizar el botón principal del Dropdown**

En `src/components/Filters.tsx`, ubicar el `<button>` dentro de `Dropdown` (líneas ~39-51) y reemplazarlo por:

```tsx
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-medium uppercase tracking-[0.18em] transition-colors border ${
          isActive
            ? 'bg-ink text-bone border-ink'
            : 'bg-transparent text-ink/70 border-mocha/25 hover:border-ink hover:text-ink'
        }`}
      >
        <span className={`opacity-70`}>{label}</span>
        <span className="font-medium max-w-[120px] truncate">{displayValue}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
```

- [ ] **Step 2: Actualizar el panel del Dropdown**

En el mismo archivo, ubicar el `motion.div` del dropdown abierto (líneas ~54-75) y reemplazarlo por:

```tsx
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 min-w-[200px] bg-bone border border-mocha/15 overflow-hidden z-30"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-left transition-colors ${
                  value === opt.id ? 'bg-sand text-ink font-medium' : 'text-ink/70 hover:bg-sand/60'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.id && <Check className="w-3.5 h-3.5 text-mocha" />}
              </button>
            ))}
          </motion.div>
```

- [ ] **Step 3: Actualizar el botón "Limpiar"**

En el mismo archivo, ubicar el botón de limpiar (líneas ~138-147) y reemplazarlo por:

```tsx
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium text-mocha hover:text-ink transition-colors"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
```

- [ ] **Step 4: Verificación visual**

- Pills con border mocha, fondo transparente cuando inactivos, fondo `ink` blanco cuando activos.
- Sin gradients, sin shadow rosado.
- Dropdown abierto: fondo `bone`, item activo en `sand`, check mocha.
- Botón limpiar: solo texto, sin pill.
- Filtrar/limpiar sigue funcionando como antes.

- [ ] **Step 5: Commit**

```bash
git add src/components/Filters.tsx
git commit -m "feat(filters): pills outline minimal con dropdown bone/sand"
```

---

### Task 6: ProductModal editorial

**Files:**
- Modify: `src/components/ProductModal.tsx`

- [ ] **Step 1: Reescribir ProductModal**

Reemplazar el contenido completo de `src/components/ProductModal.tsx` por:

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants?.forEach(v => { initial[v.type] = v.options[0]; });
    return initial;
  });

  const images = useMemo(() => {
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product.images, product.image]);

  const hasMultiple = images.length > 1;

  useEffect(() => { setCurrentIndex(0); }, [product.id]);

  const goNext = () => setCurrentIndex(i => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (!hasMultiple) return;
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasMultiple, images.length]);

  const handleAdd = () => {
    addToCart(product, selectedVariants, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl max-h-[100vh] md:max-h-[92vh] bg-bone overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-sand rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-ink" />
          </button>

          <div className="max-h-[100vh] md:max-h-[92vh] overflow-y-auto md:flex md:overflow-hidden">

            <div className="w-full md:w-1/2 md:max-h-[92vh] md:flex md:flex-col bg-sand">
              <motion.div
                drag={hasMultiple ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (!hasMultiple) return;
                  if (info.offset.x > 80) goPrev();
                  else if (info.offset.x < -80) goNext();
                }}
                className="relative flex-1 aspect-square md:aspect-auto overflow-hidden select-none touch-pan-y"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`${product.name} ${currentIndex + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                </AnimatePresence>

                {hasMultiple && (
                  <>
                    <button
                      onClick={goPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-bone/80 backdrop-blur hover:bg-bone transition-colors"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="w-5 h-5 text-ink" />
                    </button>
                    <button
                      onClick={goNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-bone/80 backdrop-blur hover:bg-bone transition-colors"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="w-5 h-5 text-ink" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-ink/70 backdrop-blur text-[10px] font-medium text-bone tracking-[0.18em] uppercase">
                      {currentIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </motion.div>

              {hasMultiple && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-bone border-t border-mocha/10">
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={`flex-shrink-0 w-14 h-14 overflow-hidden border transition-colors ${
                        i === currentIndex
                          ? 'border-ink opacity-100'
                          : 'border-mocha/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 md:max-h-[92vh] md:overflow-y-auto bg-bone">
              <span className="block text-[10px] uppercase tracking-[0.25em] font-medium text-mocha mb-4">
                {product.category}
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-ink mb-4 leading-tight">
                {product.name}
              </h2>
              <p className="font-sans font-medium text-2xl text-ink mb-8">
                ${product.price.toLocaleString('es-AR')}
              </p>
              <p className="text-mocha mb-10 leading-relaxed font-light text-sm">
                {product.description}
              </p>

              <div className="space-y-6 mb-10">
                {product.variants?.map((variant) => (
                  <div key={variant.type}>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha mb-3">
                      {variant.type === 'color' ? 'Color' : 'Talle'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.type]: option }))}
                          className={`px-5 py-2 text-[11px] uppercase tracking-[0.18em] font-medium border transition-colors ${
                            selectedVariants[variant.type] === option
                              ? 'bg-ink text-bone border-ink'
                              : 'bg-transparent text-ink/70 border-mocha/25 hover:border-ink hover:text-ink'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center border border-mocha/25 px-3 h-12">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 text-mocha hover:text-ink transition-colors"
                    aria-label="Restar"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1 text-mocha hover:text-ink transition-colors"
                    aria-label="Sumar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex-1 h-12 bg-ink text-bone flex items-center justify-center font-medium tracking-[0.22em] text-[11px] uppercase hover:bg-mocha transition-colors"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Verificación visual**

- Click en card abre modal split: galería sand izquierda, info bone derecha.
- Sin rounded corners, sin shadow, mucho aire.
- Categoría eyebrow mocha, nombre Fraunces, precio Inter medium grande.
- Selector talle/color: pills outline (mismo estilo que filters).
- CTA Agregar: ink sólido sin shadow rosado.
- Mobile: layout vertical, scroll unificado funciona (no se rompe el scroll del modal).
- Flechas ←/→ del teclado y arrastre lateral siguen funcionando si hay múltiples imágenes.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductModal.tsx
git commit -m "feat(modal): rediseño split editorial con galería sand y CTA ink"
```

---

### Task 7: CartDrawer minimal

**Files:**
- Modify: `src/components/CartDrawer.tsx`

- [ ] **Step 1: Reescribir CartDrawer**

Reemplazar el contenido completo de `src/components/CartDrawer.tsx` por:

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PaymentMethod } from '../types';
import { generateWhatsAppLink } from '../lib/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Mercado Pago', 'Transferencia', 'Efectivo'];

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, totalPrice, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mercado Pago');
  const [userData, setUserData] = useState({ name: '', address: '' });

  const handleCheckout = () => {
    if (!userData.name || !userData.address) {
      alert('Por favor, completa tu nombre y dirección.');
      return;
    }
    const link = generateWhatsAppLink(cart, totalPrice, paymentMethod, userData);
    window.open(link, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 z-[120] w-full md:w-[440px] h-full bg-bone flex flex-col"
          >
            <div className="px-6 py-5 border-b border-mocha/10 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Tu carrito</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sand rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-ink" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="font-display text-xl text-ink mb-2">Tu carrito está vacío</p>
                  <p className="text-sm text-mocha mb-6 font-light">Agregá algo para empezar.</p>
                  <button
                    onClick={onClose}
                    className="text-[11px] uppercase tracking-[0.22em] font-medium text-ink hover:text-petit transition-colors border-b border-ink hover:border-petit pb-1"
                  >
                    Volver a la tienda
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    {cart.map((item) => {
                      const variantsKey = Object.entries(item.selectedVariants).sort().map(([k, v]) => `${k}:${v}`).join('|');
                      const variantsLabel = Object.entries(item.selectedVariants).map(([_, v]) => v).join(' / ');
                      return (
                        <div key={`${item.id}-${variantsKey}`} className="flex gap-4 group">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover bg-sand"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-base text-ink truncate leading-tight">{item.name}</h4>
                            {variantsLabel && (
                              <p className="text-[10px] text-mocha uppercase tracking-[0.22em] mt-1 mb-3">
                                {variantsLabel}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 border border-mocha/20 px-2 py-1">
                                <button
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity - 1)}
                                  className="text-mocha hover:text-ink transition-colors"
                                  aria-label="Restar"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity + 1)}
                                  className="text-mocha hover:text-ink transition-colors"
                                  aria-label="Sumar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm font-medium text-ink">
                                ${(item.price * item.quantity).toLocaleString('es-AR')}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.id, variantsKey)}
                                className="opacity-50 hover:opacity-100 p-1 text-mocha hover:text-ink transition-all"
                                aria-label="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-5 pt-6 border-t border-mocha/10">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha block mb-3">
                        Método de pago
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`px-4 py-3 text-xs font-medium transition-colors border text-left flex items-center justify-between uppercase tracking-[0.18em] ${
                              paymentMethod === method
                                ? 'bg-ink text-bone border-ink'
                                : 'bg-transparent text-ink/70 border-mocha/25 hover:border-ink hover:text-ink'
                            }`}
                          >
                            {method}
                            {paymentMethod === method && <span className="w-1.5 h-1.5 bg-bone rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha block">
                        Tus datos para el envío
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={userData.name}
                        onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border border-mocha/25 focus:outline-none focus:border-ink text-sm placeholder:text-mocha/60"
                      />
                      <input
                        type="text"
                        placeholder="Dirección de envío"
                        value={userData.address}
                        onChange={e => setUserData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border border-mocha/25 focus:outline-none focus:border-ink text-sm placeholder:text-mocha/60"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-5 bg-bone border-t border-mocha/10 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha">Total</span>
                  <span className="font-display text-2xl text-ink">
                    ${totalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-petit text-bone flex items-center justify-center font-medium tracking-[0.22em] text-[11px] uppercase hover:brightness-95 transition-all"
                >
                  Finalizar por WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Verificación visual**

- Drawer derecho fondo `bone`, sin rounded, sin shadow visible (sólo el borde mocha).
- Items: thumbnail cuadrado sand, nombre serif, variantes en eyebrow mocha, controles de cantidad en pill outline.
- Selectores de pago: pills outline ink/transparent (mismo lenguaje que filtros).
- Inputs underline-style con borde mocha, foco ink.
- Total grande en serif Fraunces.
- CTA "Finalizar por WhatsApp" en `petit` (rosa apagado) — único uso prominente del rosa.
- Mobile: drawer ocupa toda la pantalla.

- [ ] **Step 3: Commit**

```bash
git add src/components/CartDrawer.tsx
git commit -m "feat(cart): drawer minimal con CTA petit y inputs editorial"
```

---

### Task 8: Footer ink

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Reescribir Footer**

Reemplazar el contenido completo de `src/components/Footer.tsx` por:

```tsx
import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-bone py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-6">
          <h2 className="text-3xl font-display tracking-tight uppercase text-gradient">Petit</h2>
          <p className="text-sm text-bone/60 leading-relaxed font-light max-w-xs">
            Creando momentos especiales para vos y tu mejor amigo con accesorios diseñados para durar.
          </p>
          <div className="flex gap-3">
            <a
              href="https://instagram.com/accesorios.petit"
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-bone/10 hover:bg-petit transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-[0.22em] text-bone mb-6">
            Colecciones
          </h4>
          <ul className="space-y-3 text-sm text-bone/60 font-light">
            <li><a href="#" className="hover:text-petit transition-colors">Collares</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Correas</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Arneses</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Ropa</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-[0.22em] text-bone mb-6">
            Contacto
          </h4>
          <ul className="space-y-4 text-sm text-bone/60 font-light">
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-petit" />
              hola@petit.com
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-petit" />
              +54 9 11 1234-5678
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-petit" />
              Buenos Aires, Argentina
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-bone/10 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-bone/30 font-sans">
          © {new Date().getFullYear()} Petit Accesorios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
```

- [ ] **Step 2: Verificación visual**

- Fondo `ink` (más negro/menos saturado que antes).
- Logo "PETIT" mantiene el gradient magenta (intacto, requisito del usuario).
- Headers de columna en Fraunces uppercase con tracking ancho, sin underline.
- Hover de links cambia a `petit` (rosa apagado).
- Iconos de contacto en `petit`.
- Tipografía cuerpo Inter light.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat(footer): paleta ink/bone con hovers petit y headers Fraunces"
```

---

### Task 9: Sección de productos en App.tsx

Quedan referencias a `brand-dark`, `brand-magenta` y `brand-pink` en el listado y los estados loading/empty.

**Files:**
- Modify: `src/App.tsx:65` (wrapper), `src/App.tsx:69-88` (cabecera de sección), `src/App.tsx:90-104` (loading/empty)

- [ ] **Step 1: Actualizar el wrapper de Store**

En `src/App.tsx`, ubicar la línea 65:

```tsx
    <div className="min-h-screen flex flex-col pt-16">
```

Dejar igual (no cambia).

- [ ] **Step 2: Actualizar la cabecera "Nuestra Colección"**

Reemplazar el bloque líneas ~70-77:

```tsx
            <div className="max-w-lg space-y-2">
              <h3 className="text-4xl font-display font-bold text-brand-dark">Nuestra Colección</h3>
              <p className="text-sm text-brand-dark/60 max-w-md font-light">
                Cada pieza es seleccionada pensando en la elegancia y el bienestar de tu mascota.
              </p>
            </div>
```

por:

```tsx
            <div className="max-w-lg space-y-3">
              <span className="block text-[10px] uppercase tracking-[0.25em] font-medium text-mocha">
                Catálogo
              </span>
              <h3 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                Nuestra <em className="italic font-light">colección</em>
              </h3>
              <p className="text-sm text-mocha max-w-md font-light leading-relaxed">
                Cada pieza es seleccionada pensando en la elegancia y el bienestar de tu mascota.
              </p>
            </div>
```

- [ ] **Step 3: Actualizar loading + empty**

Reemplazar el bloque líneas ~90-104:

```tsx
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-brand-dark/50">
              <p className="text-sm font-light">No hay productos que coincidan con los filtros.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-xs uppercase tracking-widest font-bold text-brand-magenta hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
```

por:

```tsx
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-mocha/30 border-t-ink rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-mocha">
              <p className="text-sm font-light">No hay productos que coincidan con los filtros.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-[11px] uppercase tracking-[0.22em] font-medium text-ink hover:text-petit border-b border-ink hover:border-petit pb-0.5 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
```

- [ ] **Step 4: Verificación visual**

- Cabecera "Catálogo / Nuestra colección" en serif con "colección" en italic.
- Estado loading: spinner sutil mocha/ink en lugar del rosa.
- Estado vacío: link "Limpiar filtros" estilo underline ink, hover petit.
- Filtros siguen funcionando (vaciar categorías → ver el empty state).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(store): cabecera editorial + loading/empty con paleta nueva"
```

---

### Task 10: Verificación final integrada

- [ ] **Step 1: Lint/typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors. Si aparecen errores en archivos públicos modificados, arreglarlos antes de continuar. Errores en `src/admin/*` son aceptables solo si son pre-existentes (verificar con `git stash` + `npx tsc --noEmit` + `git stash pop` si hay duda).

- [ ] **Step 2: Build de producción**

Run: `npm run build`
Expected: build exitoso sin errores.

- [ ] **Step 3: Smoke test manual del flujo completo**

Con `npm run dev` corriendo, navegar:

1. Home: hero + grid de productos cargan correctamente.
2. Aplicar filtros (categoría, talle, precio): pills funcionan, dropdown abre/cierra.
3. Limpiar filtros: estado vuelve a "Todos".
4. Click en una card: modal abre con galería + info, cerrar con X y con Esc.
5. En el modal, agregar al carrito.
6. Abrir cart drawer: item aparece, cambiar cantidad, eliminar.
7. Llenar nombre/dirección, click "Finalizar por WhatsApp": abre WhatsApp con el mensaje.
8. Repetir 1-7 en viewport mobile (DevTools).
9. Verificar que `/admin/login` (panel admin) sigue funcionando — no se rompe (puede lucir distinto al resto, eso es esperado).

- [ ] **Step 4: Commit final si hubo ajustes pequeños**

Si durante la verificación hay micro-ajustes:

```bash
git add -A
git commit -m "fix(rediseno): ajustes menores tras smoke test"
```

Si no hubo cambios, no hay nada para commitear.

---

## Self-Review Notes

Verificado contra el spec:

- ✅ Paleta nueva en Task 1 (bone/sand/mocha/ink/petit + legacy aliases para admin).
- ✅ Tipografía Fraunces + Inter en Task 1.
- ✅ Hero editorial split en Task 2.
- ✅ Navbar minimal con links centrales y mobile drawer en Task 3.
- ✅ ProductCard con hover image swap + CTA reveal en Task 4.
- ✅ Filters pills outline en Task 5.
- ✅ ProductModal split editorial en Task 6.
- ✅ CartDrawer con CTA petit (único uso prominente del rosa) en Task 7.
- ✅ Footer ink + petit hover en Task 8.
- ✅ App.tsx (sección de productos, loading/empty) en Task 9.
- ✅ Verificación final en Task 10.
- ✅ Admin fuera de scope: legacy tokens preservados como aliases para no romperlo.
- ✅ Logo gradient intacto: `.text-gradient` y `.bg-gradient` se mantienen y se usan solo en el "PETIT" del footer y la imagen `/logo.png`.

Componentes 21st-magic mencionados en el spec (sección "Componentes 21st-magic") se omiten del plan: las referencias quedan implementadas directamente en Task 3 (animated dropdown nav inline) y Task 4 (hover image swap + CTA reveal inline). Si en revisión visual el resultado se siente plano, queda como follow-up consultar `mcp__21st-magic__21st_magic_component_inspiration` para refinarlo — pero esto es discreción del usuario, no requisito del spec.
