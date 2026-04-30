import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PaymentMethod } from '../types';
import { generateWhatsAppLink } from '../lib/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Mercado Pago', 'Transferencia', 'Efectivo'];

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, totalPrice, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mercado Pago');
  const [userData, setUserData] = useState({ name: '', address: '', dogWeight: '' });

  const handleCheckout = () => {
    if (!userData.name || !userData.address || !userData.dogWeight) {
      alert('Por favor, completa tu nombre, dirección y el peso del perro.');
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
            className="fixed inset-0 z-[110] bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 z-[120] w-full md:w-[440px] h-full bg-bone flex flex-col"
          >
            <div className="px-6 py-5 border-b border-mocha/10 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Tu carrito</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sand rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-ink" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="font-display text-xl text-ink mb-2">Tu carrito está vacío</p>
                  <p className="text-sm text-mocha mb-6 font-light">Agregá algo para empezar.</p>
                  <button
                    onClick={onClose}
                    className="text-[11px] uppercase tracking-[0.22em] font-medium text-ink hover:text-petit transition-colors border-b border-ink hover:border-petit pb-1"
                  >
                    Volver a la tienda
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    {cart.map((item) => {
                      const variantsKey = Object.entries(item.selectedVariants).sort().map(([k, v]) => `${k}:${v}`).join('|');
                      const variantsLabel = Object.entries(item.selectedVariants).map(([_, v]) => v).join(' / ');
                      return (
                        <div key={`${item.id}-${variantsKey}`} className="flex gap-4 group">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover bg-sand"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-base text-ink truncate leading-tight">{item.name}</h4>
                            {variantsLabel && (
                              <p className="text-[10px] text-mocha uppercase tracking-[0.22em] mt-1 mb-3">
                                {variantsLabel}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 border border-mocha/20 px-2 py-1">
                                <button
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity - 1)}
                                  className="text-mocha hover:text-ink transition-colors"
                                  aria-label="Restar"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, variantsKey, item.quantity + 1)}
                                  className="text-mocha hover:text-ink transition-colors"
                                  aria-label="Sumar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm font-medium text-ink">
                                ${(item.price * item.quantity).toLocaleString('es-AR')}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.id, variantsKey)}
                                className="opacity-50 hover:opacity-100 p-1 text-mocha hover:text-ink transition-all"
                                aria-label="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-5 pt-6 border-t border-mocha/10">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha block mb-3">
                        Método de pago
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`px-4 py-3 text-xs font-medium transition-colors border text-left flex items-center justify-between uppercase tracking-[0.18em] ${
                              paymentMethod === method
                                ? 'bg-ink text-bone border-ink'
                                : 'bg-transparent text-ink/70 border-mocha/25 hover:border-ink hover:text-ink'
                            }`}
                          >
                            {method}
                            {paymentMethod === method && <span className="w-1.5 h-1.5 bg-bone rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha block">
                        Tus datos para el envío
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={userData.name}
                        onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border border-mocha/25 focus:outline-none focus:border-ink text-sm placeholder:text-mocha/60"
                      />
                      <input
                        type="text"
                        placeholder="Dirección de envío"
                        value={userData.address}
                        onChange={e => setUserData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border border-mocha/25 focus:outline-none focus:border-ink text-sm placeholder:text-mocha/60"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Peso del perro (kg)"
                        value={userData.dogWeight}
                        onChange={e => setUserData(prev => ({ ...prev, dogWeight: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border border-mocha/25 focus:outline-none focus:border-ink text-sm placeholder:text-mocha/60"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-5 bg-bone border-t border-mocha/10 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-mocha">Total</span>
                  <span className="font-display text-2xl text-ink">
                    ${totalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-gradient text-white rounded-full flex items-center justify-center font-bold tracking-wide text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-magenta/25"
                >
                  Finalizar por WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
