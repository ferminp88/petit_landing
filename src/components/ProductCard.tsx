import React, { useMemo } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const images = useMemo(() => {
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product.images, product.image]);

  const hasSecond = images.length >= 2;
  const primary = images[0];
  const secondary = hasSecond ? images[1] : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-sand mb-4">
        {primary && (
          <img
            src={primary}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hasSecond ? 'group-hover:opacity-0' : ''}`}
            referrerPolicy="no-referrer"
          />
        )}
        {secondary && (
          <img
            src={secondary}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="hidden md:block absolute left-4 right-4 bottom-4 py-3 bg-ink text-bone text-[10px] uppercase tracking-[0.25em] font-medium translate-y-[110%] group-hover:translate-y-0 transition-transform duration-400"
        >
          Ver producto
        </button>
      </div>

      <div className="px-1 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.22em] text-mocha">
          {product.category}
        </p>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base text-ink leading-snug">
            {product.name}
          </h3>
          <span className="font-sans font-medium text-sm text-ink whitespace-nowrap">
            ${product.price.toLocaleString('es-AR')}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="md:hidden mt-2 w-full py-2.5 border border-mocha/25 text-ink text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-ink hover:text-bone hover:border-ink transition-colors"
        >
          Ver producto
        </button>
      </div>
    </motion.div>
  );
};
