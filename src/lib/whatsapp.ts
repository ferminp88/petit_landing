import { CartItem, PaymentMethod } from '../types';

export const WHATSAPP_NUMBER = '5491112345678'; // Reemplazar por el real

export const generateWhatsAppLink = (
  cart: CartItem[], 
  totalPrice: number, 
  paymentMethod: PaymentMethod,
  userData: { name: string; address: string }
) => {
  const itemsText = cart.map(item => {
    const variants = Object.entries(item.selectedVariants)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
    return `- ${item.name}${variants ? ` (${variants})` : ''} x${item.quantity}`;
  }).join('\n');

  const message = `Hola! Quiero comprar los siguientes productos:

${itemsText}

Total: $${totalPrice}

Método de pago: ${paymentMethod}

Nombre: ${userData.name}
Dirección de envío: ${userData.address}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
