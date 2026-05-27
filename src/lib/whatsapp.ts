import { CartItem, PaymentMethod, EnvioOption } from '../types';

export const WHATSAPP_NUMBER = '5492213990191';

export interface CheckoutUserData {
  name: string;
  locality: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  references: string;
}

export const generateWhatsAppLink = (
  cart: CartItem[],
  totalPrice: number,
  paymentMethod: PaymentMethod,
  envio: EnvioOption,
  userData: CheckoutUserData
) => {
  const itemsText = cart.map(item => {
    const variants = Object.entries(item.selectedVariants)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
    return `- ${item.name}${variants ? ` (${variants})` : ''} x${item.quantity}`;
  }).join('\n');

  const lines = [
    'Hola! Quiero comprar los siguientes productos:',
    '',
    itemsText,
    '',
    `Total: $${totalPrice}`,
    '',
    `Método de pago: ${paymentMethod}`,
    `Envío: ${envio}`,
    '',
    `Nombre y apellido: ${userData.name}`,
    `Localidad y provincia: ${userData.locality}`,
    `Mail: ${userData.email}`,
    `Celular: ${userData.phone}`,
    `Código postal: ${userData.postalCode}`,
    `Dirección completa: ${userData.address}`,
  ];

  if (userData.references.trim()) {
    lines.push(`Referencias del domicilio: ${userData.references}`);
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
};
