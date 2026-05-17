import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicBanner } from '../lib/api';

interface HeroCarouselProps {
  banners: PublicBanner[];
  onSelectCategory: (category: string) => void;
  intervalMs?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  banners,
  onSelectCategory,
  intervalMs = 5000,
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex(i => (i + 1) % banners.length), [banners.length]);
  const prev = useCallback(
    () => setIndex(i => (i - 1 + banners.length) % banners.length),
    [banners.length]
  );

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [banners.length, intervalMs, paused, next]);

  if (banners.length === 0) return null;

  const current = banners[index] ?? banners[0];
  const handleClick = () => {
    if (current.link) onSelectCategory(current.link);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative w-full bg-sand overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Aspect ratio: más alto en mobile, más apaisado en desktop */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] max-h-[640px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img
              src={current.image}
              alt={current.title}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Gradiente para legibilidad del texto */}
            <div className="absolute inset-0 bg-linear-to-r from-ink/70 via-ink/30 to-transparent md:via-ink/10" />
          </motion.div>
        </AnimatePresence>

        {/* Texto + CTA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${current.id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 max-w-2xl"
          >
            {current.subtitle && (
              <span className="block text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-white/85 mb-3">
                {current.subtitle}
              </span>
            )}
            {current.title && (
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] mb-5 max-w-xl">
                {current.title}
              </h1>
            )}
            <button
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-white text-ink text-[11px] sm:text-xs uppercase tracking-[0.18em] font-bold w-fit shadow-xl hover:bg-bone transition-colors"
            >
              Ver ahora →
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Flechas (solo desktop, si hay más de 1) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur hover:bg-white items-center justify-center shadow-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-ink" />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur hover:bg-white items-center justify-center shadow-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-ink" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
