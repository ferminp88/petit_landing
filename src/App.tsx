import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Filters, PRICE_RANGES } from './components/Filters';
import { AdminLogin } from './admin/AdminLogin';
import { AdminProducts } from './admin/AdminProducts';
import { AdminProductForm } from './admin/AdminProductForm';
import { fetchProducts } from './lib/api';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';

const POPULAR_PALETTES = [
  'from-pink-100 to-pink-200',
  'from-amber-100 to-amber-200',
  'from-emerald-100 to-emerald-200',
  'from-violet-100 to-violet-200',
  'from-orange-100 to-orange-200',
  'from-sky-100 to-sky-200',
  'from-rose-100 to-rose-200',
  'from-lime-100 to-lime-200',
];

interface PopularCategoriesProps {
  products: Product[];
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

function PopularCategories({ products, categories, activeCategory, onSelect }: PopularCategoriesProps) {
  if (categories.length === 0) return null;

  const items = useMemo(() => {
    const all = ['Todos', ...categories];
    return all.map(cat => {
      const sample = cat === 'Todos'
        ? products[0]
        : products.find(p => p.category === cat);
      const count = cat === 'Todos'
        ? products.length
        : products.filter(p => p.category === cat).length;
      return { cat, image: sample?.image, count };
    });
  }, [products, categories]);

  return (
    <section className="w-full pt-6 pb-4">
      <div className="max-w-7xl mx-auto px-4 mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.25em] font-bold text-mocha mb-1">
            Categorías
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">Lo más popular</h2>
        </div>
        {activeCategory !== 'Todos' && (
          <button
            onClick={() => onSelect('Todos')}
            className="text-[11px] uppercase tracking-[0.18em] font-bold text-brand-magenta hover:underline"
          >
            Ver todo →
          </button>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-bone to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-bone to-transparent z-10" />

        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide">
          {items.map(({ cat, image, count }, i) => {
            const isActive = activeCategory === cat;
            const palette = POPULAR_PALETTES[i % POPULAR_PALETTES.length];
            return (
              <button
                key={cat}
                onClick={() => onSelect(cat)}
                className={`group relative flex-shrink-0 snap-start w-36 md:w-44 rounded-3xl overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'ring-2 ring-brand-magenta shadow-lg shadow-brand-magenta/20 scale-[1.02]'
                    : 'hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div className={`bg-gradient-to-br ${palette} aspect-square flex items-center justify-center p-4 relative`}>
                  {image ? (
                    <img
                      src={image}
                      alt={cat}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="font-display font-bold text-5xl text-white/80">
                      {cat.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-[10px] font-bold text-ink shadow-sm">
                    {count}
                  </span>
                </div>
                <div className={`px-3 py-3 text-center ${isActive ? 'bg-gradient text-white' : 'bg-white text-ink'}`}>
                  <p className="font-display font-bold text-sm leading-tight truncate">{cat}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [category, setCategory] = useState('Todos');
  const [size, setSize] = useState('Todos');
  const [priceRangeId, setPriceRangeId] = useState('any');

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );
  const sizes = useMemo(() => {
    const all = new Set<string>();
    for (const p of products) {
      const sizeVariant = p.variants?.find(v => v.type === 'size');
      sizeVariant?.options.forEach(o => all.add(o));
    }
    return Array.from(all);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const priceRange = PRICE_RANGES.find(r => r.id === priceRangeId) ?? PRICE_RANGES[0];
    return products.filter(p => {
      if (category !== 'Todos' && p.category !== category) return false;
      if (size !== 'Todos') {
        const sizeVariant = p.variants?.find(v => v.type === 'size');
        if (!sizeVariant?.options.includes(size)) return false;
      }
      if (p.price < priceRange.min || p.price > priceRange.max) return false;
      return true;
    });
  }, [products, category, size, priceRangeId]);

  const clearFilters = () => {
    setCategory('Todos');
    setSize('Todos');
    setPriceRangeId('any');
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="flex-grow">
        <Hero />
        <PopularCategories
          products={products}
          categories={categories}
          activeCategory={category}
          onSelect={(c) => {
            setCategory(c);
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <section id="products" className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div className="max-w-lg space-y-3">
              <span className="block text-[10px] uppercase tracking-[0.25em] font-medium text-mocha">
                Catálogo
              </span>
              <h3 className="font-display text-4xl md:text-5xl font-medium text-ink leading-tight">
                Nuestra colección
              </h3>
              <p className="text-sm text-mocha max-w-md font-light leading-relaxed">
                Cada pieza es seleccionada pensando en la elegancia y el bienestar de tu mascota.
              </p>
            </div>
            <Filters
              categories={categories}
              sizes={sizes}
              category={category}
              size={size}
              priceRangeId={priceRangeId}
              onCategoryChange={setCategory}
              onSizeChange={setSize}
              onPriceRangeChange={setPriceRangeId}
              onClear={clearFilters}
            />
          </div>

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
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10"
            >
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

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('petit_admin_token');
  if (!isTokenValid(token)) {
    localStorage.removeItem('petit_admin_token');
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
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
