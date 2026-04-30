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
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
];

interface PopularCategoriesProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

function PopularCategories({ categories, activeCategory, onSelect }: PopularCategoriesProps) {
  if (categories.length === 0) return null;
  const items = ['Todos', ...categories].slice(0, 6);
  return (
    <section className="max-w-7xl mx-auto px-4 pt-4 pb-2">
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">Lo más popular</h2>
      </div>
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((cat, i) => {
          const isActive = activeCategory === cat || (cat === 'Todos' && activeCategory === 'Todos');
          const palette = POPULAR_PALETTES[i % POPULAR_PALETTES.length];
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="group flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-display font-bold transition-all ${palette} ${
                  isActive
                    ? 'ring-4 ring-brand-magenta/40 scale-105'
                    : 'group-hover:scale-105 group-hover:shadow-md'
                }`}
              >
                {cat.charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-brand-magenta' : 'text-ink'}`}>
                {cat}
              </span>
            </button>
          );
        })}
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
