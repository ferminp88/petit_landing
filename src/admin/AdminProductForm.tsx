import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* TOP NAV */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base text-white">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</span>
        </div>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Salir"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 p-4 md:p-7">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-5 md:p-8 space-y-5">

          {/* FOTO */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Foto del Producto
            </label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-pink-300 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl mx-auto" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-slate-400">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Tocá para subir una foto</p>
                  <p className="text-xs mt-1 opacity-70">JPG, PNG, WEBP — máx. 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageChange} />
          </div>

          {/* NOMBRE Y PRECIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* CATEGORÍA */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Categoría</label>
            <input
              type="text"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
              placeholder="Ej: Collares"
            />
          </div>

          {/* DESCRIPCIÓN */}
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

          {/* COLORES Y TALLES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Colores (opcional)</label>
              <input
                type="text"
                value={form.color_options}
                onChange={e => setForm(p => ({ ...p, color_options: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                placeholder="Marrón, Negro, Natural"
              />
              <p className="text-[10px] text-slate-400 mt-1">Separados por coma</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Separados por coma</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
  );
}
