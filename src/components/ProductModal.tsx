import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Heart, Truck, ShieldCheck, Star } from 'lucide-react';
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
          className="relative w-full max-w-5xl max-h-[100vh] md:max-h-[92vh] bg-white md:rounded-3xl overflow-hidden shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-sand rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-ink" />
          </button>

          <div className="max-h-[100vh] md:max-h-[92vh] overflow-y-auto md:flex md:overflow-hidden">

            <div className="w-full md:w-1/2 md:max-h-[92vh] md:flex md:flex-col bg-bone">
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
                <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-mocha/10">
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === currentIndex
                          ? 'border-brand-magenta opacity-100'
                          : 'border-mocha/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-10 md:max-h-[92vh] md:overflow-y-auto bg-white">
              <span className="inline-block px-3 py-1 rounded-full bg-bone text-[10px] uppercase tracking-[0.2em] font-bold text-mocha mb-4">
                {product.category}
              </span>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mb-3 leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-1 mb-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-mocha/20 text-mocha/20'}`}
                  />
                ))}
                <span className="text-xs text-mocha ml-2">(4.0) · 12 reseñas</span>
              </div>

              <p className="font-display font-bold text-3xl text-brand-magenta mb-6">
                ${product.price.toLocaleString('es-AR')}
              </p>

              <p className="text-ink/70 mb-6 leading-relaxed font-light text-sm">
                {product.description}
              </p>

              <div className="rounded-xl bg-bone/60 divide-y divide-mocha/10 mb-6 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-mocha font-medium">Categoría</span>
                  <span className="text-ink font-semibold">{product.category}</span>
                </div>
                {product.variants?.map(v => (
                  <div key={v.type} className="flex justify-between px-4 py-2.5">
                    <span className="text-mocha font-medium capitalize">{v.type === 'size' ? 'Talles' : 'Colores'}</span>
                    <span className="text-ink font-semibold text-right">{v.options.join(', ')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-5 mb-6">
                {product.variants?.map((variant) => (
                  <div key={variant.type}>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha mb-2">
                      {variant.type === 'color' ? 'Elegí color' : 'Elegí talle'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.type]: option }))}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            selectedVariants[variant.type] === option
                              ? 'bg-gradient text-white border-transparent shadow-md shadow-brand-magenta/20'
                              : 'bg-white text-ink/70 border-mocha/25 hover:border-brand-magenta hover:text-brand-magenta'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex items-center bg-bone rounded-full px-4 h-12">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 text-mocha hover:text-brand-magenta transition-colors"
                    aria-label="Restar"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1 text-mocha hover:text-brand-magenta transition-colors"
                    aria-label="Sumar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex-1 h-12 bg-gradient text-white rounded-full font-bold tracking-wide text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-magenta/25"
                >
                  Agregar al carrito
                </button>

                <button
                  type="button"
                  className="h-12 w-12 flex-shrink-0 rounded-full border border-mocha/25 flex items-center justify-center hover:border-brand-magenta hover:text-brand-magenta transition-colors"
                  aria-label="Favorito"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs text-mocha border-t border-mocha/10 pt-4">
                <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-magenta" /> Envío gratis en compras superiores a $20.000</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-magenta" /> Cambios y devoluciones dentro de 14 días</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
