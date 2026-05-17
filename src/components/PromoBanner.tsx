import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PublicBanner } from '../lib/api';

interface PromoBannerProps {
  banners: PublicBanner[];
  onSelectCategory: (category: string) => void;
  intervalMs?: number;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ banners, onSelectCategory, intervalMs = 5000 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), intervalMs);
    return () => clearInterval(t);
  }, [banners.length, intervalMs]);

  if (banners.length === 0) return null;

  const current = banners[index] ?? banners[0];
  const handleClick = () => {
    if (current.link) onSelectCategory(current.link);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="col-span-full my-2 md:my-4">
      <button
        onClick={handleClick}
        className="relative w-full overflow-hidden rounded-3xl aspect-[16/7] md:aspect-[21/7] block text-left bg-sand group"
        aria-label={current.title || 'Promoción'}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id}
            src={current.image}
            alt={current.title}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/40 to-transparent" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-y-0 left-0 flex flex-col justify-center p-6 md:p-12 max-w-md md:max-w-lg"
          >
            {current.subtitle && (
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.25em] font-bold text-white/80 mb-2">
                {current.subtitle}
              </span>
            )}
            {current.title && (
              <h3 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight">
                {current.title}
              </h3>
            )}
            <span className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white text-ink text-[11px] uppercase tracking-[0.18em] font-bold w-fit shadow-lg group-hover:bg-bone transition-colors">
              Ver ahora →
            </span>
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {banners.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </button>
    </div>
  );
};
