import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PaymentMethod } from '../types';
import { generateWhatsAppLink } from '../lib/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mercado Pago');
  const [userData, setUserData] = useState({ name: '', address: '' });

  const handleCheckout = () => {
    if (!userData.name || !userData.address) {
      alert('Por favor, completa tu nombre y dirección.');
      return;
    }
    const link = generateWhatsAppLink(cart, totalPrice, paymentMethod, userData);
    window.open(link, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-brand-brown/40 backdrop-blur-sm md:hidden" 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[120] w-full md:w-[450px] h-full bg-brand-cream shadow-2xl flex flex-col"
          >            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-brand-dark">Carrito de Compras</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <p className="font-display font-bold text-xl mb-4 text-brand-dark">Tu carrito está vacío</p>
                  <button 
                    onClick={onClose}
                    className="text-sm font-bold tracking-widest text-brand-magenta underline underline-offset-4"
                  >
                    VOLVER A LA TIENDA
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const variantsKey = Object.entries(item.selectedVariants).sort().map(([k, v]) => `${k}:${v}`).join('|');
                      return (
                        <div key={`${item.id}-${variantsKey}`} className="flex gap-4 p-4 bg-black/5 rounded-2xl group">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-20 h-20 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-bold text-brand-dark truncate">{item.name}</h4>
                            <p className="text-[10px] text-brand-dark/40 uppercase font-bold tracking-wider mb-2">
                              {Object.entries(item.selectedVariants).map(([k, v]) => `${v}`).join(' / ')}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity - 1)}
                                  className="text-brand-dark/40 hover:text-brand-magenta"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity + 1)}
                                  className="text-brand-dark/40 hover:text-brand-magenta"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm font-bold">
                                ${(item.price * item.quantity).toLocaleString('es-AR')}
                              </p>
                              <button 
                                onClick={() => removeFromCart(item.id, variantsKey)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-black/5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/40 block mb-3">
                        Método de Pago
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {(['Mercado Pago', 'Transferencia', 'Efectivo'] as PaymentMethod[]).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border text-left flex items-center justify-between ${
                              paymentMethod === method
                                ? 'bg-gradient text-white border-brand-pink/20 shadow-md'
                                : 'bg-white text-brand-dark border-black/5 hover:border-black/20'
                            }`}
                          >
                            {method}
                            {paymentMethod === method && <div className="w-2 h-2 bg-white rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/40 block">
                        Tus Datos para el Envío
                      </label>
                      <input 
                        type="text" 
                        placeholder="Nombre Completo"
                        value={userData.name}
                        onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/5 focus:outline-none focus:border-brand-magenta text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Dirección de Envío"
                        value={userData.address}
                        onChange={e => setUserData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/5 focus:outline-none focus:border-brand-magenta text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-brand-cream border-t border-black/5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xl text-brand-dark/40">Total</span>
                  <span className="text-2xl font-bold text-brand-dark">
                    ${totalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full h-14 bg-gradient text-white rounded-xl flex items-center justify-center gap-3 font-bold tracking-widest hover:brightness-105 transition-all shadow-xl shadow-brand-pink/20"
                >
                  FINALIZAR COMPRA
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-center text-black font-medium">
                  Serás redirigido a WhatsApp para coordinar
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
