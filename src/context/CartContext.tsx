import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, PaymentMethod } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variants: Record<string, string>, quantity: number) => void;
  removeFromCart: (itemId: string, variantsKey: string) => void;
  updateQuantity: (itemId: string, variantsKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('petit_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('petit_cart', JSON.stringify(cart));
  }, [cart]);

  const getVariantsKey = (variants: Record<string, string>) => {
    return Object.entries(variants).sort().map(([k, v]) => `${k}:${v}`).join('|');
  };

  const addToCart = (product: Product, selectedVariants: Record<string, string>, quantity: number) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.id === product.id && getVariantsKey(item.selectedVariants) === getVariantsKey(selectedVariants)
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [...prev, { ...product, selectedVariants, quantity }];
    });
  };

  const removeFromCart = (itemId: string, variantsKey: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === itemId && getVariantsKey(item.selectedVariants) === variantsKey)
    ));
  };

  const updateQuantity = (itemId: string, variantsKey: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id === itemId && getVariantsKey(item.selectedVariants) === variantsKey) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
