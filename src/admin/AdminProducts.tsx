import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import { adminFetchProducts, adminDeleteProduct, adminToggleProduct } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { RawProduct } from '../types';
import { AdminShell } from './AdminShell';

export function AdminProducts() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function load() {
    try {
      const data = await adminFetchProducts();
      setProducts(data);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: number) {
    try {
      const updated = await adminToggleProduct(id);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try {
      await adminDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  const PAGE_SIZE = 10;
  const total = products.length;
  const activos = products.filter(p => p.active === 1).length;
  const inactivos = total - activos;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const newProductButton = (
    <button
      onClick={() => navigate('/admin/products/new')}
      className="flex items-center gap-1.5 bg-gradient text-white px-4 py-2.5 rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-pink-500/30"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Nuevo producto</span>
      <span className="sm:hidden">Nuevo</span>
    </button>
  );

  return (
    <AdminShell title="Productos" subtitle="Gestioná tu catálogo de accesorios" actions={newProductButton}>
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Total', value: total, accent: 'from-pink-50 to-pink-100', text: 'text-pink-700' },
            { label: 'Activos', value: activos, accent: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700' },
            { label: 'Inactivos', value: inactivos, accent: 'from-slate-50 to-slate-100', text: 'text-slate-600' },
          ].map(s => (
            <div key={s.label} className={`relative bg-gradient-to-br ${s.accent} rounded-3xl p-5 overflow-hidden`}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{s.label}</div>
              <div className={`font-display text-3xl md:text-4xl font-bold ${s.text}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* TABLA DESKTOP / CARDS MOBILE */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No hay productos. ¡Creá el primero!
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block">
                <div className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-6 py-4 bg-pink-50/50 border-b border-pink-100 text-[10px] font-bold uppercase tracking-widest text-pink-700">
                  <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Estado</span><span>Acciones</span>
                </div>
                {paginated.map(product => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-6 py-4 border-b border-slate-100 items-center last:border-0 hover:bg-pink-50/30 transition-colors"
                  >
                    <img
                      src={product.image || 'https://placehold.co/60x60/f5f1ea/94a3b8?text=?'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-800 truncate">{product.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{product.category}</div>
                    </div>
                    <span className="text-sm text-slate-600">{product.category}</span>
                    <span className="font-display font-bold text-base text-pink-600">${product.price.toLocaleString('es-AR')}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {product.active ? 'Activo' : 'Oculto'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggle(product.id)} className={`p-2 rounded-xl transition-colors ${product.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title={product.active ? 'Desactivar' : 'Activar'}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-slate-100">
                {paginated.map(product => (
                  <div key={product.id} className="p-4 flex gap-3">
                    <img
                      src={product.image || 'https://placehold.co/60x60/f5f1ea/94a3b8?text=?'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-2xl flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-sm text-slate-800 leading-tight">{product.name}</p>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {product.active ? 'Activo' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{product.category} · <span className="font-display font-bold text-pink-600">${product.price.toLocaleString('es-AR')}</span></p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="flex-1 py-1.5 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => handleToggle(product.id)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${product.active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Power className="w-3 h-3" /> {product.active ? 'Ocultar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="py-1.5 px-3 bg-red-50 text-red-500 rounded-xl">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <span className="text-xs text-slate-500">
              Página {page} de {totalPages} · {total} productos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                    n === page ? 'bg-gradient text-white shadow-md shadow-pink-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
    </AdminShell>
  );
}
