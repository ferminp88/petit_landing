import React from 'react';
import { ShoppingBag, Instagram, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onCartClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { totalItems } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-md border-b border-brand-accent/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-brand-beige/20 rounded-full transition-colors md:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img
              src="/logo.png"
              alt="Petit Logo"
              className="h-14 w-auto cursor-pointer"
            />
          </a>
          <a href="https://instagram.com/accesorios.petit" target="_blank" rel="noreferrer" className="hidden md:flex p-2 hover:bg-brand-beige/20 rounded-full transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        <div />

        <div className="flex items-center gap-4">
          <button 
            onClick={onCartClick}
            className="relative p-2 hover:bg-black/5 rounded-full transition-colors group"
          >
            <ShoppingBag className="w-6 h-6 text-brand-dark" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-gradient text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </nav>
  );
};
