export interface ProductSize {
  name: string;
  price: number;
  compareAtPrice: number | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  image: string;
  images: string[];
  category: string;
  variants?: {
    type: 'color' | 'size';
    options: string[];
  }[];
  sizes?: ProductSize[];
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariants: Record<string, string>;
}

export type PaymentMethod = 'Transferencia' | 'Efectivo' | 'Mercado Pago';

export interface CheckoutData {
  paymentMethod: PaymentMethod;
  name: string;
  address: string;
}

export interface RawProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  image: string;
  images: string;
  color_options: string;
  size_options: string;
  active: number;
  is_new?: number;
  is_best_seller?: number;
  sizes?: { name: string; price: number; compare_at_price: number | null }[];
  created_at: string;
}
