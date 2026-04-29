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
