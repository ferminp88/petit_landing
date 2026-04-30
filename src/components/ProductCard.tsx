import React, { useMemo, useState } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { Heart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [liked, setLiked] = useState(false);

  const images = useMemo(() => {
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product.images, product.image]);

  const hasSecond = images.length >= 2;
  const primary = images[0];
  const secondary = hasSecond ? images[1] : undefined;

  const sizeOptions = product.variants?.find(v => v.type === 'size')?.options ?? [];

  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const percentOff = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-bone">
        {primary && (
          <img
            src={primary}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${hasSecond ? 'group-hover:opacity-0' : ''}`}
            referrerPolicy="no-referrer"
          />
        )}
        {secondary && (
          <img
            src={secondary}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        )}

        {hasDiscount && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient text-white text-[10px] uppercase tracking-wider font-bold shadow-md">
            −{percentOff}%
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Favorito"
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-brand-magenta text-brand-magenta' : 'text-ink/60'}`} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha">
          {product.category}
        </p>

        <h3 className="font-display font-semibold text-base text-ink leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-3 h-3 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-mocha/20 text-mocha/20'}`}
            />
          ))}
          <span className="text-[10px] text-mocha ml-1">(4.0)</span>
        </div>

        {sizeOptions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {sizeOptions.slice(0, 4).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-bone text-[10px] font-bold text-mocha border border-mocha/15">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-lg text-brand-magenta">
              ${product.price.toLocaleString('es-AR')}
            </span>
            {hasDiscount && (
              <span className="text-xs font-medium text-mocha line-through">
                ${(product.compareAtPrice as number).toLocaleString('es-AR')}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="px-3 py-1.5 rounded-full bg-gradient text-white text-[10px] uppercase tracking-wider font-bold hover:brightness-110 transition-all shadow-sm"
          >
            Ver
          </button>
        </div>
      </div>
    </motion.div>
  );
};
