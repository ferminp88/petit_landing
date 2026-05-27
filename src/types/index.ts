export interface ProductSize {
  name: string;
  price: number;
  compareAtPrice: number | null;
}

export interface ProductColor {
  name: string;
  image: string | null;
}

export interface ProductMeter {
  name: string;
}

export interface VariantPrice {
  size: string;        // '' si el producto no usa talles
  meters: string;      // '' si el producto no usa metros
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
  colors?: ProductColor[];
  meters?: ProductMeter[];
  priceMatrix?: VariantPrice[];
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariants: Record<string, string>;
}

export type PaymentMethod = 'Transferencia' | 'Efectivo (solo para retiro en Villa Elisa)';
export type EnvioOption = 'Retiro en Villa Elisa' | 'Envío por Correo Argentino' | 'Moto Mensajería';

export interface CheckoutData {
  paymentMethod: PaymentMethod;
  envio: EnvioOption;
  name: string;
  locality: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  references: string;
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
  colors?: { name: string; image: string | null }[];
  meters?: { name: string }[];
  price_matrix?: { size: string; meters: string; price: number; compare_at_price: number | null }[];
  created_at: string;
}
