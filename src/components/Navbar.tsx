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
