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
import { DogCursor } from './components/DogCursor';
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
    <>
    <DogCursor />
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
      <Route path="/admin/products/new" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
      <Route path="/admin/products/:id/edit" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
    </Routes>
    </>
  );
}
