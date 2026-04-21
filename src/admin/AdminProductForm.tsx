import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct, adminFetchProducts } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', color_options: '', size_options: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    adminFetchProducts().then(products => {
      const product = products.find(p => p.id === parseInt(id!));
      if (!product) { navigate('/admin/products'); return; }
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        category: product.category || '',
        color_options: product.color_options || '',
        size_options: product.size_options || '',
      });
      if (product.image) setImagePreview(product.image);
    }).catch(() => navigate('/admin/products'));
  }, [id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('El precio debe ser un número'); return; }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('price', form.price);
    formData.append('category', form.category.trim());
    formData.append('color_options', form.color_options.trim());
    formData.append('size_options', form.size_options.trim());
    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEdit) {
        await adminUpdateProduct(parseInt(id!), formData);
      } else {
        await adminCreateProduct(formData);
      }
      navigate('/admin/products');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error guardando producto');
    } finally {
      setLoading(false);
    }
  }

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
        <div className="bg-white border-b border-slate-200 px-7 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h1>
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-slate-200 p-8 space-y-6">

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Foto del Producto
              </label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-pink-300 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-xl mx-auto" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Arrastrá una foto o hacé click para subir</p>
                    <p className="text-xs mt-1">JPG, PNG, WEBP — máx. 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="Ej: Collar de Cuero"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Precio ($) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="4500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Categoría *</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                placeholder="Ej: Collares"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 resize-none"
                placeholder="Describí el producto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Colores (opcional)</label>
                <input
                  type="text"
                  value={form.color_options}
                  onChange={e => setForm(p => ({ ...p, color_options: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="Marrón, Negro, Natural"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separados por coma. Vacío = sin variante.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Talles (opcional)</label>
                <input
                  type="text"
                  value={form.size_options}
                  onChange={e => setForm(p => ({ ...p, size_options: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  placeholder="S, M, L, XL"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separados por coma. Vacío = sin variante.</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-gradient text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
