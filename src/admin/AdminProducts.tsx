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
      className="flex items-center gap-1.5 bg-pink-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Nuevo Producto</span>
      <span className="sm:hidden">Nuevo</span>
    </button>
  );

  return (
    <AdminShell title="Productos" actions={newProductButton}>
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: total, color: 'text-slate-800' },
            { label: 'Activos', value: activos, color: 'text-green-600' },
            { label: 'Inactivos', value: inactivos, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
              <div className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* TABLA DESKTOP / CARDS MOBILE */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

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
                <div className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-5 py-3 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Estado</span><span>Acciones</span>
                </div>
                {paginated.map(product => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-5 py-3 border-b border-slate-50 items-center last:border-0"
                  >
                    <img
                      src={product.image || 'https://placehold.co/60x60/f1f5f9/94a3b8?text=?'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-800 truncate">{product.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{product.category}</div>
                    </div>
                    <span className="text-sm text-slate-600">{product.category}</span>
                    <span className="text-sm font-bold text-slate-800">${product.price.toLocaleString('es-AR')}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggle(product.id)} className={`p-2 rounded-lg transition-colors ${product.active ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`} title={product.active ? 'Desactivar' : 'Activar'}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
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
                      src={product.image || 'https://placehold.co/60x60/f1f5f9/94a3b8?text=?'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-sm text-slate-800 leading-tight">{product.name}</p>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{product.category} · <span className="font-bold text-slate-700">${product.price.toLocaleString('es-AR')}</span></p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => handleToggle(product.id)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${product.active ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                          <Power className="w-3 h-3" /> {product.active ? 'Ocultar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="py-1.5 px-3 bg-red-50 text-red-500 rounded-lg">
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
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <span className="text-xs text-slate-400">
              Página {page} de {totalPages} · {total} productos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    n === page ? 'bg-pink-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
    </AdminShell>
  );
}
