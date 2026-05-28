import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { Card, CardContent, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const primary = useMemo(() => {
    if (product.images?.length) return product.images[0];
    return product.image || '';
  }, [product.images, product.image]);

  const sizes = product.sizes;
  const sizePrices = sizes?.map(s => s.price) ?? [];
  const minSizePrice = sizePrices.length > 0 ? Math.min(...sizePrices) : null;
  const maxSizePrice = sizePrices.length > 0 ? Math.max(...sizePrices) : null;
  const displayPrice = minSizePrice ?? product.price;
  const hasPriceRange = minSizePrice !== null && maxSizePrice !== null && minSizePrice !== maxSizePrice;

  const minSize = sizes && minSizePrice !== null ? sizes.find(s => s.price === minSizePrice) : null;
  const displayCompareAt = minSize ? minSize.compareAtPrice : product.compareAtPrice;
  const hasDiscount = displayCompareAt !== null && displayCompareAt > displayPrice;
  const percentOff = hasDiscount
    ? Math.round((1 - displayPrice / (displayCompareAt as number)) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        onClick={onClick}
        className="w-full h-full overflow-hidden group cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col"
      >
        {/* Image carousel */}
        <div className="relative aspect-square overflow-hidden bg-bone">
          {primary && (
            <motion.img
              src={primary}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              referrerPolicy="no-referrer"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="bg-sky-500 hover:bg-sky-500/90 text-white">Nuevo</Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">Más vendido</Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-gradient text-white border-transparent">−{percentOff}%</Badge>
            )}
          </div>

        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1">
          <div className="space-y-3 h-full flex flex-col">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha h-4 truncate">
                {product.category}
              </p>
              <h3 className="font-display font-semibold text-base text-ink leading-snug line-clamp-2 mt-1 min-h-[2.75rem]">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="ml-1 text-sm font-medium">4.0</span>
                </div>
                <span className="text-xs text-muted-foreground">(reseñas)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              {hasPriceRange && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-mocha">Desde</span>
              )}
              <span className="font-display text-lg font-bold text-brand-magenta">
                ${displayPrice.toLocaleString('es-AR')}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${(displayCompareAt as number).toLocaleString('es-AR')}
                </span>
              )}
            </div>

          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full bg-gradient hover:brightness-110 text-white"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ver detalle
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
