import React from 'react';
import { motion } from 'motion/react';
import { PublicBanner } from '../lib/api';

interface CategoryBannersProps {
  banners: PublicBanner[];
  onSelectCategory: (category: string) => void;
}

export const CategoryBanners: React.FC<CategoryBannersProps> = ({ banners, onSelectCategory }) => {
  if (banners.length === 0) return null;

  const handleClick = (b: PublicBanner) => {
    if (b.link) onSelectCategory(b.link);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className={`grid gap-4 md:gap-6 ${
        banners.length === 1 ? 'grid-cols-1' :
        banners.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-3'
      }`}>
        {banners.map((b, i) => (
          <motion.button
            key={b.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            onClick={() => handleClick(b)}
            className="group relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[3/4] bg-sand text-left"
            aria-label={`Ver ${b.title || 'categoría'}`}
          >
            {b.image && (
              <img
                src={b.image}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              {b.subtitle && (
                <span className="block text-[10px] uppercase tracking-[0.22em] font-bold text-white/80 mb-1">
                  {b.subtitle}
                </span>
              )}
              {b.title && (
                <h3 className="font-display text-xl md:text-2xl font-bold text-white leading-tight">
                  {b.title}
                </h3>
              )}
              <span className="inline-flex items-center gap-1.5 mt-3 text-[11px] uppercase tracking-[0.18em] font-bold text-white border-b border-white/60 group-hover:border-white pb-0.5 transition-colors">
                Ver productos →
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};
