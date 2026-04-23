import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
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
    if (!hasMultiple && images.length === 0) return;
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-brand-cream rounded-2xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-brand-cream/80 backdrop-blur rounded-full hover:bg-brand-cream transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-h-[90vh] overflow-y-auto md:flex md:overflow-hidden">

          <div className="w-full md:w-1/2 md:max-h-[90vh] md:flex md:flex-col bg-brand-cream">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-brand-cream/80 backdrop-blur rounded-full hover:bg-brand-cream shadow-md transition-all"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-cream/80 backdrop-blur rounded-full hover:bg-brand-cream shadow-md transition-all"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-dark/40 backdrop-blur rounded-full text-[10px] font-bold text-white tracking-wider">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </motion.div>

            {hasMultiple && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-brand-cream border-t border-black/5">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentIndex
                        ? 'border-brand-magenta opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 md:max-h-[90vh] md:overflow-y-auto">
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

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
