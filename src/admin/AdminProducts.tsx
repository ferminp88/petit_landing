import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import { adminFetchProducts, adminDeleteProduct, adminToggleProduct } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { RawProduct } from '../types';

export function AdminProducts() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  const total = products.length;
  const activos = products.filter(p => p.active === 1).length;
  const inactivos = total - activos;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-52 bg-slate-900 text-white flex flex-col p-4 gap-2 shrink-0">
        <div className="text-xl font-display font-bold text-pink-400 px-3 py-4 tracking-widest">PETIT</div>
        <div className="px-3 py-2 bg-pink-500 rounded-lg text-sm font-bold">📦 Productos</div>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="mt-auto px-3 py-2 text-slate-400 hover:text-white text-sm text-left transition-colors"
        >
          🚪 Salir
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Productos</h1>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 bg-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-4 mb-7">
            {[
              { label: 'Total', value: total, color: 'text-slate-800' },
              { label: 'Activos', value: activos, color: 'text-green-600' },
              { label: 'Inactivos', value: inactivos, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_110px_90px_100px_120px] gap-3 px-5 py-3 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Estado</span><span>Acciones</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No hay productos. ¡Creá el primero!
              </div>
            ) : products.map(product => (
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
                  <button
                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                    className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(product.id)}
                    className={`p-2 rounded-lg transition-colors ${product.active ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                    title={product.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
