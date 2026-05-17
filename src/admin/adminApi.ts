import { RawProduct } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('petit_admin_token') || '';
  return { Authorization: `Bearer ${token}` };
}

async function jsonRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error en la solicitud');
  }
  return res.json();
}

export async function adminFetchProducts(): Promise<RawProduct[]> {
  return jsonRequest<RawProduct[]>('/api/admin/products');
}

export async function adminToggleProduct(id: number): Promise<RawProduct> {
  return jsonRequest<RawProduct>(`/api/admin/products/${id}/toggle`, { method: 'PATCH' });
}

export async function adminDeleteProduct(id: number): Promise<void> {
  await jsonRequest(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export async function adminCreateProduct(formData: FormData): Promise<RawProduct> {
  return jsonRequest<RawProduct>('/api/admin/products', { method: 'POST', body: formData });
}

export async function adminUpdateProduct(id: number, formData: FormData): Promise<RawProduct> {
  return jsonRequest<RawProduct>(`/api/admin/products/${id}`, { method: 'PUT', body: formData });
}

// === Categorías ===
export interface AdminCategory { id: number; name: string }

export async function adminFetchCategories(): Promise<AdminCategory[]> {
  return jsonRequest<AdminCategory[]>('/api/admin/categories');
}

export async function adminCreateCategory(name: string): Promise<AdminCategory> {
  return jsonRequest<AdminCategory>('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await jsonRequest(`/api/admin/categories/${id}`, { method: 'DELETE' });
}

// === Talles ===
export interface AdminSize { id: number; name: string }

export async function adminFetchSizes(): Promise<AdminSize[]> {
  return jsonRequest<AdminSize[]>('/api/admin/sizes');
}

export async function adminCreateSize(name: string): Promise<AdminSize> {
  return jsonRequest<AdminSize>('/api/admin/sizes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function adminDeleteSize(id: number): Promise<void> {
  await jsonRequest(`/api/admin/sizes/${id}`, { method: 'DELETE' });
}

// === Promoción ===
export interface AdminPromotion {
  id: number;
  image: string;
  description: string;
  old_price: number | null;
  new_price: number | null;
  active: number;
}

export async function adminFetchPromotion(): Promise<AdminPromotion> {
  return jsonRequest<AdminPromotion>('/api/admin/promotion');
}

export async function adminUpdatePromotion(formData: FormData): Promise<AdminPromotion> {
  return jsonRequest<AdminPromotion>('/api/admin/promotion', { method: 'PUT', body: formData });
}

// === Banners ===
export type BannerType = 'category' | 'promo';

export interface AdminBanner {
  id: number;
  type: BannerType;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: number;
  active: number;
  created_at: string;
}

export async function adminFetchBanners(type?: BannerType): Promise<AdminBanner[]> {
  const qs = type ? `?type=${type}` : '';
  return jsonRequest<AdminBanner[]>(`/api/admin/banners${qs}`);
}

export async function adminCreateBanner(formData: FormData): Promise<AdminBanner> {
  return jsonRequest<AdminBanner>('/api/admin/banners', { method: 'POST', body: formData });
}

export async function adminUpdateBanner(id: number, formData: FormData): Promise<AdminBanner> {
  return jsonRequest<AdminBanner>(`/api/admin/banners/${id}`, { method: 'PUT', body: formData });
}

export async function adminToggleBanner(id: number): Promise<AdminBanner> {
  return jsonRequest<AdminBanner>(`/api/admin/banners/${id}/toggle`, { method: 'PATCH' });
}

export async function adminDeleteBanner(id: number): Promise<void> {
  await jsonRequest(`/api/admin/banners/${id}`, { method: 'DELETE' });
}
