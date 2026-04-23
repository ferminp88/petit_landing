import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, LogOut, X, Star } from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct, adminFetchProducts } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';

const MAX_IMAGES = 10;

function parseImagesJSON(val: string | undefined | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', color_options: '', size_options: '',
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
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
      const imgs = parseImagesJSON(product.images);
      if (imgs.length > 0) setExistingImages(imgs);
      else if (product.image) setExistingImages([product.image]);
    }).catch(() => navigate('/admin/products'));
  }, [id]);

  useEffect(() => {
    return () => {
      newFilePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newFilePreviews]);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - existingImages.length - newFiles.length;
    if (remaining <= 0) return;
    const toAdd = arr.slice(0, remaining);
    setNewFiles(prev => [...prev, ...toAdd]);
    setNewFilePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeExisting(url: string) {
    setExistingImages(prev => prev.filter(u => u !== url));
  }

  function removeNewFile(index: number) {
    URL.revokeObjectURL(newFilePreviews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewFilePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function makeExistingFirst(url: string) {
    setExistingImages(prev => [url, ...prev.filter(u => u !== url)]);
  }

  const totalImages = existingImages.length + newFiles.length;
  const canAddMore = totalImages < MAX_IMAGES;

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
    formData.append('existing_images', JSON.stringify(existingImages));
    for (const file of newFiles) formData.append('images', file);

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

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Fotos del Producto ({totalImages}/{MAX_IMAGES})
              </label>
              <span className="text-[10px] text-slate-400">La primera es la principal</span>
            </div>

            {totalImages > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                {existingImages.map((url, i) => (
                  <div key={`ex-${url}`} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Principal</span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      {i !== 0 && (
                        <button type="button" onClick={() => makeExistingFirst(url)} className="p-1.5 bg-white rounded-lg hover:bg-pink-50" title="Hacer principal">
                          <Star className="w-3.5 h-3.5 text-pink-500" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeExisting(url)} className="p-1.5 bg-white rounded-lg hover:bg-red-50" title="Eliminar">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {newFilePreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-pink-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-pink-100 text-pink-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Nueva</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => removeNewFile(i)} className="p-1.5 bg-white rounded-lg hover:bg-red-50" title="Descartar">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canAddMore && (
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-pink-300 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                <div className="text-slate-400">
                  <Upload className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{totalImages === 0 ? 'Tocá para subir fotos' : 'Agregar más fotos'}</p>
                  <p className="text-xs mt-1 opacity-70">JPG, PNG, WEBP — máx. 5MB c/u — hasta {MAX_IMAGES} fotos</p>
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleImageChange} />
          </div>

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
