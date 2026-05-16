import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Star, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { Card, CardContent, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';

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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const sizeOptions = product.variants?.find(v => v.type === 'size')?.options ?? [];

  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const percentOff = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const primary = images[currentImageIndex];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={onClick}
        className="w-full overflow-hidden group cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col"
      >
        {/* Image carousel */}
        <div className="relative aspect-square overflow-hidden bg-bone">
          {primary && (
            <motion.img
              key={currentImageIndex}
              src={primary}
              alt={`${product.name} - vista ${currentImageIndex + 1}`}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              referrerPolicy="no-referrer"
            />
          )}

          {images.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={prevImage}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={nextImage}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-primary w-4' : 'bg-primary/30 w-1.5'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    aria-label={`Ver imagen ${index + 1}`}
                  />
                ))}
              </div>
            </>
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

          {/* Wishlist */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm ${
              liked ? 'text-brand-magenta' : ''
            }`}
            onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
            aria-label="Favorito"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-brand-magenta' : ''}`} />
          </Button>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-mocha">
                {product.category}
              </p>
              <h3 className="font-display font-semibold text-base text-ink leading-snug line-clamp-2 mt-1">
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
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-brand-magenta">
                ${product.price.toLocaleString('es-AR')}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${(product.compareAtPrice as number).toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {/* Sizes */}
            {sizeOptions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Talles</div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      className={`min-w-[2.5rem] h-8 px-2 rounded-md text-xs font-bold transition-all ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 hover:bg-muted text-mocha'
                      }`}
                      onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
