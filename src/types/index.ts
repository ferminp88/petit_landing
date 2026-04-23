export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images: string[];
  category: string;
  variants?: {
    type: 'color' | 'size';
    options: string[];
  }[];
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
  category: string;
  image: string;
  images: string;
  color_options: string;
  size_options: string;
  active: number;
  created_at: string;
}
