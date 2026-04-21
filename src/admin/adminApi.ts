import { RawProduct } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('petit_admin_token') || '';
  return { Authorization: `Bearer ${token}` };
}

export async function adminFetchProducts(): Promise<RawProduct[]> {
  const res = await fetch(`${API_BASE}/api/admin/products`, { headers: authHeaders() });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error cargando productos');
  return res.json();
}

export async function adminToggleProduct(id: number): Promise<RawProduct> {
  const res = await fetch(`${API_BASE}/api/admin/products/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error actualizando producto');
  return res.json();
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Error eliminando producto');
}

export async function adminCreateProduct(formData: FormData): Promise<RawProduct> {
  const res = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error creando producto');
  }
  return res.json();
}

export async function adminUpdateProduct(id: number, formData: FormData): Promise<RawProduct> {
  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error actualizando producto');
  }
  return res.json();
}
