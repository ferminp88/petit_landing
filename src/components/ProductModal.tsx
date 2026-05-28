import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Heart, Truck, ShieldCheck, Star } from 'lucide-react';
import { Product, ProductSize } from '../types';
import { useCart } from '../context/CartContext';
import { sortBySize } from '../utils/sizeOrder';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageManuallyChanged, setImageManuallyChanged] = useState(false);
  const meters = product.meters ?? [];
  const hasMeters = meters.length > 0;
  const matrix = product.priceMatrix ?? [];

  const findCell = (size: string, mtr: string) =>
    matrix.find(r => r.size === size && r.meters === mtr) ?? null;

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants?.forEach(v => {
      if (v.type === 'size' && product.sizes && product.sizes.length > 0) return;
      initial[v.type] = v.options[0];
    });
    if (product.sizes && product.sizes.length > 0) {
      initial.size = sortBySize<ProductSize>(product.sizes, s => s.name)[0].name;
    }
    if (hasMeters) {
      const firstSize = product.sizes && product.sizes.length > 0
        ? sortBySize<ProductSize>(product.sizes, s => s.name)[0].name
        : '';
      const firstOk = meters.find(m => findCell(firstSize, m.name)) ?? meters[0];
      initial.meters = firstOk.name;
    }
    return initial;
  });

  const sortedSizes = useMemo(
    () => (product.sizes ? sortBySize<ProductSize>(product.sizes, s => s.name) : []),
    [product.sizes]
  );

  const selectedSize = useMemo(() => {
    if (sortedSizes.length === 0) return null;
    return sortedSizes.find(s => s.name === selectedVariants.size) ?? sortedSizes[0];
  }, [sortedSizes, selectedVariants.size]);

  const currentSizeName = sortedSizes.length > 0 ? (selectedSize?.name ?? '') : '';
  const currentMeters = hasMeters ? (selectedVariants.meters ?? '') : '';

  const currentCell = useMemo(
    () => (matrix.length > 0 ? findCell(currentSizeName, currentMeters) : null),
    [matrix, currentSizeName, currentMeters]
  );

  // Cuando hay metros, la matriz determina el precio; si no, el talle (comportamiento previo).
  const effectivePrice = hasMeters
    ? (currentCell ? currentCell.price : product.price)
    : (selectedSize ? selectedSize.price : product.price);
  const effectiveCompareAt = hasMeters
    ? (currentCell ? currentCell.compareAtPrice : product.compareAtPrice)
    : (selectedSize ? selectedSize.compareAtPrice : product.compareAtPrice);

  const comboAvailable = !hasMeters || currentCell !== null;

  const images = useMemo(() => {
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product.images, product.image]);

  const colorImage = useMemo(() => {
    const selected = selectedVariants.color;
    if (!selected || !product.colors) return null;
    const match = product.colors.find(c => c.name === selected);
    return match?.image ?? null;
  }, [product.colors, selectedVariants.color]);

  const displayedImage = (!imageManuallyChanged && colorImage) ? colorImage : images[currentIndex];
  const hasMultiple = images.length > 1;

  useEffect(() => { setCurrentIndex(0); setImageManuallyChanged(false); }, [product.id]);

  const goNext = () => { setImageManuallyChanged(true); setCurrentIndex(i => (i + 1) % images.length); };
  const goPrev = () => { setImageManuallyChanged(true); setCurrentIndex(i => (i - 1 + images.length) % images.length); };
  const selectImage = (i: number) => { setImageManuallyChanged(true); setCurrentIndex(i); };

  function selectColor(name: string) {
    setSelectedVariants(prev => ({ ...prev, color: name }));
    setImageManuallyChanged(false);
  }

  function selectSize(name: string) {
    setSelectedVariants(prev => {
      const next = { ...prev, size: name };
      // Si el metraje actual no existe para este talle, pasar al primero disponible.
      if (hasMeters && !findCell(name, prev.meters ?? '')) {
        const firstOk = meters.find(m => findCell(name, m.name));
        if (firstOk) next.meters = firstOk.name;
      }
      return next;
    });
  }

  function selectMeters(name: string) {
    setSelectedVariants(prev => ({ ...prev, meters: name }));
  }

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
    if (!comboAvailable) return;
    const productForCart = { ...product, price: effectivePrice, compareAtPrice: effectiveCompareAt };
    addToCart(productForCart, selectedVariants, quantity);
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

            <div className="w-full md:w-1/2 md:max-h-[92vh] md:flex md:flex-row bg-bone">
              {hasMultiple && (
                <div className="hidden md:flex flex-col gap-2 p-3 overflow-y-auto bg-white border-r border-mocha/10 w-20 flex-shrink-0">
                  {images.map((img, i) => (
                    <button
                      key={`side-${img}-${i}`}
                      type="button"
                      onClick={() => selectImage(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                        i === currentIndex && !colorImage
                          ? 'border-brand-magenta opacity-100'
                          : 'border-mocha/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
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
                    key={colorImage ?? currentIndex}
                    src={displayedImage}
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
                <div className="md:hidden flex gap-2 p-3 overflow-x-auto bg-white border-t border-mocha/10">
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => selectImage(i)}
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

              {(() => {
                const hasDiscount = effectiveCompareAt !== null && effectiveCompareAt > effectivePrice;
                const percentOff = hasDiscount
                  ? Math.round((1 - effectivePrice / (effectiveCompareAt as number)) * 100)
                  : 0;
                return (
                  <div className="flex items-baseline gap-3 mb-6 flex-wrap">
                    <p className="font-display font-bold text-3xl text-brand-magenta">
                      ${effectivePrice.toLocaleString('es-AR')}
                    </p>
                    {hasDiscount && (
                      <>
                        <p className="text-base font-medium text-mocha line-through">
                          ${(effectiveCompareAt as number).toLocaleString('es-AR')}
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-gradient text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                          −{percentOff}% OFF
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}

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
                {product.variants?.filter(v => !(v.type === 'size' && product.sizes && product.sizes.length > 0)).map((variant) => (
                  <div key={variant.type}>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha mb-2">
                      {variant.type === 'color' ? 'Elegí color' : 'Elegí talle'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => variant.type === 'color' ? selectColor(option) : setSelectedVariants(prev => ({ ...prev, [variant.type]: option }))}
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

                {sortedSizes.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha mb-2">
                      Elegí talle
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortedSizes.map((s) => {
                        const isSel = currentSizeName === s.name;
                        const unavailable = hasMeters && !findCell(s.name, currentMeters);
                        return (
                          <button
                            key={s.name}
                            onClick={() => selectSize(s.name)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                              isSel
                                ? 'bg-gradient text-white border-transparent shadow-md shadow-brand-magenta/20'
                                : unavailable
                                  ? 'bg-bone text-ink/30 border-mocha/15 line-through'
                                  : 'bg-white text-ink/70 border-mocha/25 hover:border-brand-magenta hover:text-brand-magenta'
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasMeters && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha mb-2">
                      Elegí metros
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {meters.map((m) => {
                        const isSel = currentMeters === m.name;
                        const unavailable = !findCell(currentSizeName, m.name);
                        return (
                          <button
                            key={m.name}
                            onClick={() => selectMeters(m.name)}
                            disabled={unavailable}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                              isSel
                                ? 'bg-gradient text-white border-transparent shadow-md shadow-brand-magenta/20'
                                : unavailable
                                  ? 'bg-bone text-ink/30 border-mocha/15 line-through cursor-not-allowed'
                                  : 'bg-white text-ink/70 border-mocha/25 hover:border-brand-magenta hover:text-brand-magenta'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                    {!comboAvailable && (
                      <p className="text-[11px] text-red-500 font-medium mt-2">
                        Esta combinación no está disponible. Elegí otra.
                      </p>
                    )}
                  </div>
                )}
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
                  disabled={!comboAvailable}
                  className="flex-1 h-12 bg-gradient text-white rounded-full font-bold tracking-wide text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-magenta/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  {comboAvailable ? 'Agregar al carrito' : 'No disponible'}
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
                {/*<span className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-magenta" /> Envío gratis en compras superiores a $20.000</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-magenta" /> Cambios y devoluciones dentro de 14 días</span>*/}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
