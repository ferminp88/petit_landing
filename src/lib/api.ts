import { Product, RawProduct } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

function parseImagesField(raw: RawProduct): string[] {
  if (raw.images) {
    try {
      const parsed = JSON.parse(raw.images);
      if (Array.isArray(parsed)) {
        const urls = parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
        if (urls.length > 0) return urls.map(resolveUrl);
      }
    } catch {
      // fall through
    }
  }
  return raw.image ? [resolveUrl(raw.image)] : [];
}

function mapProduct(raw: RawProduct): Product {
  const variants: Product['variants'] = [];
  if (raw.color_options?.trim()) {
    variants.push({ type: 'color', options: raw.color_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  if (raw.size_options?.trim()) {
    variants.push({ type: 'size', options: raw.size_options.split(',').map(s => s.trim()).filter(Boolean) });
  }
  const images = parseImagesField(raw);
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description,
    price: raw.price,
    compareAtPrice: raw.compare_at_price ?? null,
    category: raw.category,
    image: images[0] ?? '',
    images,
    variants: variants.length > 0 ? variants : undefined,
    isNew: raw.is_new === 1,
    isBestSeller: raw.is_best_seller === 1,
  };
}

export interface PromotionData {
  image: string;
  description: string;
  oldPrice: number | null;
  newPrice: number | null;
}

export async function fetchPromotion(): Promise<PromotionData | null> {
  const res = await fetch(`${API_BASE}/api/promotion`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data) return null;
  return {
    image: data.image ? resolveUrl(data.image) : '',
    description: data.description || '',
    oldPrice: data.old_price ?? null,
    newPrice: data.new_price ?? null,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Error cargando productos');
  const data: RawProduct[] = await res.json();
  return data.map(mapProduct);
}

export interface PublicBanner {
  id: number;
  type: 'category' | 'promo';
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export async function fetchBanners(): Promise<{ categories: PublicBanner[]; promos: PublicBanner[] }> {
  const res = await fetch(`${API_BASE}/api/banners`);
  if (!res.ok) return { categories: [], promos: [] };
  const data = await res.json();
  const mapBanner = (b: any): PublicBanner => ({
    id: b.id,
    type: b.type,
    title: b.title || '',
    subtitle: b.subtitle || '',
    image: b.image ? resolveUrl(b.image) : '',
    link: b.link || '',
  });
  return {
    categories: Array.isArray(data?.categories) ? data.categories.map(mapBanner) : [],
    promos: Array.isArray(data?.promos) ? data.promos.map(mapBanner) : [],
  };
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`);
  if (!res.ok) throw new Error('Producto no encontrado');
  const data: RawProduct = await res.json();
  return mapProduct(data);
}
