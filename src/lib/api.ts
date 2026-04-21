import { Product, RawProduct } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function mapProduct(raw: RawProduct): Product {
  const variants: Product['variants'] = [];
  if (raw.color_options?.trim()) {
    variants.push({ type: 'color', options: raw.color_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  if (raw.size_options?.trim()) {
    variants.push({ type: 'size', options: raw.size_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description,
    price: raw.price,
    category: raw.category,
    image: raw.image.startsWith('/uploads/') ? `${API_BASE}${raw.image}` : raw.image,
    variants: variants.length > 0 ? variants : undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Error cargando productos');
  const data: RawProduct[] = await res.json();
  return data.map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`);
  if (!res.ok) throw new Error('Producto no encontrado');
  const data: RawProduct = await res.json();
  return mapProduct(data);
}
