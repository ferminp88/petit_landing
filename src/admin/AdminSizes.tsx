import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Ruler } from 'lucide-react';
import { adminFetchSizes, adminCreateSize, adminDeleteSize, AdminSize } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminShell } from './AdminShell';

export function AdminSizes() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setItems(await adminFetchSizes());
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const created = await adminCreateSize(name.trim());
      setItems(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error creando talle');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(s: AdminSize) {
    if (!confirm(`¿Eliminar "${s.name}"? Los productos con este talle no se borran, pero quedará el texto suelto.`)) return;
    try {
      await adminDeleteSize(s.id);
      setItems(prev => prev.filter(x => x.id !== s.id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  return (
    <AdminShell title="Talles">
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-7 mb-5">
        <h2 className="font-bold text-slate-800 mb-1">Agregar talle</h2>
        <p className="text-xs text-slate-500 mb-4">Talles globales disponibles para todos los productos. Se eligen como multi-select en el form.</p>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: M, 120cm, S (hasta 5kg)"
            maxLength={50}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex items-center justify-center gap-1.5 bg-pink-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </form>
        {error && <p className="text-sm text-red-500 font-medium mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Aún no hay talles. Agregá el primero.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                  <Ruler className="w-4 h-4 text-pink-400" />
                  {s.name}
                </span>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
