import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants?.forEach(v => {
      initial[v.type] = v.options[0];
    });
    return initial;
  });

  const handleAdd = () => {
    addToCart(product, selectedVariants, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-brown/40 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-brand-cream rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 bg-brand-cream/50 backdrop-blur rounded-full hover:bg-brand-cream transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
            <span className="inline-block px-3 py-1 bg-black/5 text-[10px] uppercase tracking-widest font-bold text-brand-magenta rounded-lg mb-4">
              {product.category}
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-4">
              {product.name}
            </h2>
            <p className="text-2xl font-bold text-brand-dark mb-6">
              ${product.price.toLocaleString('es-AR')}
            </p>
            <p className="text-brand-dark/60 mb-8 leading-relaxed font-light text-sm">
              {product.description}
            </p>

            <div className="space-y-6 mb-8">
              {product.variants?.map((variant) => (
                <div key={variant.type}>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-dark/40 mb-3">
                    Seleccionar {variant.type === 'color' ? 'Color' : 'Talle'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.type]: option }))}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedVariants[variant.type] === option
                            ? 'bg-gradient text-white shadow-md shadow-brand-pink/20'
                            : 'bg-black/5 text-brand-dark/60 hover:bg-black/10'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center bg-black/5 rounded-2xl px-4 py-3 h-14 border border-black/5">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-1 hover:text-brand-magenta transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-1 hover:text-brand-magenta transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={handleAdd}
                className="flex-1 h-14 bg-gradient text-white rounded-2xl flex items-center justify-center gap-3 font-bold tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-pink/30"
              >
                <ShoppingCart className="w-5 h-5" />
                AGREGAR AL CARRITO
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
