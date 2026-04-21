import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-beige mb-4 shadow-sm group-hover:shadow-md transition-all">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="px-2">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-brand-dark transition-colors">
              {product.name}
            </h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40">
              {product.category}
            </p>
          </div>
          <span className="font-bold text-sm text-brand-dark">
            ${product.price.toLocaleString('es-AR')}
          </span>
        </div>
        <button className="mt-3 w-full py-3 bg-black/5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gradient hover:text-white transition-all duration-300">
          Agregar al carrito
        </button>
      </div>
    </motion.div>
  );
};
