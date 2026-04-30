import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag } from 'lucide-react';
import { adminFetchCategories, adminCreateCategory, adminDeleteCategory, AdminCategory } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminShell } from './AdminShell';

export function AdminCategories() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setItems(await adminFetchCategories());
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
      const created = await adminCreateCategory(name.trim());
      setItems(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error creando categoría');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(c: AdminCategory) {
    if (!confirm(`¿Eliminar "${c.name}"? Los productos con esta categoría no se borran, pero quedará el texto suelto.`)) return;
    try {
      await adminDeleteCategory(c.id);
      setItems(prev => prev.filter(x => x.id !== c.id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  return (
    <AdminShell title="Categorías" subtitle="Las usás como dropdown al cargar productos">
      <div className="bg-white rounded-3xl p-6 md:p-8 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Agregar categoría</h2>
            <p className="text-xs text-slate-500">Quedan disponibles globalmente para todos los productos.</p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Collares"
            maxLength={100}
            className="flex-1 px-5 py-3 bg-bone border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-orange-300 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex items-center justify-center gap-1.5 bg-gradient text-white px-6 py-3 rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </form>
        {error && <p className="text-sm text-red-500 font-medium mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Aún no hay categorías. Agregá la primera ✨</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-orange-50/30 transition-colors">
                <span className="flex items-center gap-3 text-sm text-slate-800 font-bold">
                  <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </span>
                  {c.name}
                </span>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
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
