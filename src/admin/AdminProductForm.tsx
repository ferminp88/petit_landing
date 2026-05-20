import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Star } from 'lucide-react';
import {
  adminCreateProduct, adminUpdateProduct, adminFetchProducts,
  adminFetchCategories, adminFetchSizes,
  AdminCategory, AdminSize,
} from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminShell } from './AdminShell';

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
    name: '', description: '', price: '', compare_at_price: '', category: '', color_options: '',
  });
  interface SizeRow { name: string; price: string; compare_at_price: string }
  const [productSizes, setProductSizes] = useState<SizeRow[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [colorFiles, setColorFiles] = useState<Record<string, File>>({});
  const [colorPreviews, setColorPreviews] = useState<Record<string, string>>({});
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [allCategories, setAllCategories] = useState<AdminCategory[]>([]);
  const [allSizes, setAllSizes] = useState<AdminSize[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminFetchCategories(), adminFetchSizes()])
      .then(([cats, sizes]) => {
        setAllCategories(cats);
        setAllSizes(sizes);
      })
      .catch((err: any) => {
        if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
      });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminFetchProducts().then(products => {
      const product = products.find(p => p.id === parseInt(id!));
      if (!product) { navigate('/admin/products'); return; }
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        compare_at_price: product.compare_at_price !== null && product.compare_at_price !== undefined ? String(product.compare_at_price) : '',
        category: product.category || '',
        color_options: product.color_options || '',
      });
      if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        setProductSizes(
          [...product.sizes]
            .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
            .map(s => ({
              name: s.name,
              price: String(s.price),
              compare_at_price: s.compare_at_price !== null && s.compare_at_price !== undefined ? String(s.compare_at_price) : '',
            }))
        );
      } else {
        const existingSizes = String(product.size_options || '').split(',').map(s => s.trim()).filter(Boolean);
        setProductSizes(existingSizes.map(name => ({
          name,
          price: String(product.price),
          compare_at_price: product.compare_at_price !== null && product.compare_at_price !== undefined ? String(product.compare_at_price) : '',
        })));
      }
      if (Array.isArray((product as any).colors)) {
        const map: Record<string, string> = {};
        for (const c of (product as any).colors as { name: string; image: string | null }[]) {
          if (c.image) map[c.name] = c.image;
        }
        setColorImages(map);
      }
      setIsNew(product.is_new === 1);
      setIsBestSeller(product.is_best_seller === 1);
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

  useEffect(() => {
    return () => {
      Object.values(colorPreviews).forEach((u: string) => URL.revokeObjectURL(u));
    };
  }, [colorPreviews]);

  function pickColorFile(name: string, file: File) {
    setColorFiles(prev => ({ ...prev, [name]: file }));
    setColorPreviews(prev => {
      if (prev[name]) URL.revokeObjectURL(prev[name]);
      return { ...prev, [name]: URL.createObjectURL(file) };
    });
    setColorImages(prev => ({ ...prev, [name]: '' }));
  }

  function clearColorImage(name: string) {
    setColorFiles(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setColorPreviews(prev => {
      if (prev[name]) URL.revokeObjectURL(prev[name]);
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setColorImages(prev => ({ ...prev, [name]: '' }));
  }

  const colorList = useMemo(() => {
    return form.color_options
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [form.color_options]);

  const percentOff = useMemo(() => {
    const price = parseInt(form.price);
    const compareAt = parseInt(form.compare_at_price);
    if (!isFinite(price) || !isFinite(compareAt) || compareAt <= 0 || price >= compareAt) return null;
    return Math.round((1 - price / compareAt) * 100);
  }, [form.price, form.compare_at_price]);

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

  function toggleSize(name: string) {
    setProductSizes(prev => {
      const exists = prev.find(s => s.name === name);
      if (exists) return prev.filter(s => s.name !== name);
      const next: SizeRow = {
        name,
        price: form.price || '',
        compare_at_price: form.compare_at_price || '',
      };
      return [...prev, next].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      );
    });
  }

  function updateSizeField(name: string, field: 'price' | 'compare_at_price', value: string) {
    setProductSizes(prev => prev.map(s => s.name === name ? { ...s, [field]: value } : s));
  }

  const totalImages = existingImages.length + newFiles.length;
  const canAddMore = totalImages < MAX_IMAGES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('El precio debe ser un número'); return; }
    if (form.compare_at_price && isNaN(Number(form.compare_at_price))) { setError('El precio anterior debe ser un número'); return; }

    for (const s of productSizes) {
      if (!s.price || isNaN(Number(s.price)) || Number(s.price) < 0) {
        setError(`El precio del talle "${s.name}" es inválido`);
        return;
      }
      if (s.compare_at_price && isNaN(Number(s.compare_at_price))) {
        setError(`El precio anterior del talle "${s.name}" es inválido`);
        return;
      }
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('price', form.price);
    formData.append('compare_at_price', form.compare_at_price || '');
    formData.append('category', form.category.trim());
    formData.append('color_options', form.color_options.trim());
    formData.append('size_options', productSizes.map(s => s.name).join(', '));
    formData.append('sizes', JSON.stringify(productSizes.map(s => ({
      name: s.name,
      price: Number(s.price),
      compare_at_price: s.compare_at_price ? Number(s.compare_at_price) : null,
    }))));
    const colorsPayload: { name: string; image: string }[] = [];
    let pendingIdx = 0;
    for (const name of colorList) {
      const file = colorFiles[name];
      if (file) {
        colorsPayload.push({ name, image: `pending:${pendingIdx}` });
        formData.append('color_images', file);
        pendingIdx++;
      } else {
        const url = (colorImages[name] || '').trim();
        if (url) colorsPayload.push({ name, image: url });
      }
    }
    formData.append('colors', JSON.stringify(colorsPayload));
    formData.append('is_new', isNew ? '1' : '0');
    formData.append('is_best_seller', isBestSeller ? '1' : '0');
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

  const backAction = (
    <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-600">
      <ArrowLeft className="w-5 h-5" />
    </button>
  );

  return (
    <AdminShell title={isEdit ? 'Editar producto' : 'Nuevo producto'} subtitle={isEdit ? 'Actualizá los datos del producto' : 'Cargá un nuevo producto al catálogo'} actions={backAction}>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Precio actual ($) *</label>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
              placeholder="4500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Precio anterior ($)</label>
            <input
              type="number"
              value={form.compare_at_price}
              onChange={e => setForm(p => ({ ...p, compare_at_price: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
              placeholder="6000 (opcional)"
              min="0"
            />
            {percentOff !== null && (
              <p className="text-[11px] font-bold text-pink-600 mt-1.5">−{percentOff}% OFF</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Categoría</label>
          <select
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 bg-white"
          >
            <option value="">— Sin categoría —</option>
            {allCategories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {allCategories.length === 0 && (
            <p className="text-[11px] text-slate-400 mt-1.5">
              Aún no hay categorías. Creá la primera en <button type="button" onClick={() => navigate('/admin/categories')} className="text-pink-500 underline">Categorías</button>.
            </p>
          )}
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

          {colorList.length > 0 && (
            <div className="mt-3 space-y-2 bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
                Imagen por color (opcional)
              </p>
              {colorList.map(name => {
                const url = colorImages[name] || '';
                const preview = colorPreviews[name];
                const thumb = preview || url;
                const hasImage = Boolean(thumb);
                return (
                  <div key={name} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <span className="px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg min-w-[80px] text-center">
                      {name}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white hover:border-pink-300 cursor-pointer transition-colors">
                        <span>{hasImage ? 'Cambiar imagen' : 'Subir imagen'}</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) pickColorFile(name, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {hasImage && (
                        <button
                          type="button"
                          onClick={() => clearColorImage(name)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Quitar imagen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {hasImage ? (
                      <img src={thumb} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200" />
                    )}
                  </div>
                );
              })}
              <p className="text-[10px] text-slate-400 mt-1">
                Subí una imagen por color. Si el color no tiene imagen, se muestra la galería general del producto.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Talles (opcional) {productSizes.length > 0 && <span className="text-pink-500">— {productSizes.length} seleccionado{productSizes.length === 1 ? '' : 's'}</span>}
          </label>
          {allSizes.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              Aún no hay talles. Creá los primeros en <button type="button" onClick={() => navigate('/admin/sizes')} className="text-pink-500 underline">Talles</button>.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {allSizes.map(s => {
                  const isSelected = productSizes.some(ps => ps.name === s.name);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSize(s.name)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isSelected
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>

              {productSizes.length > 0 && (
                <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
                    Precio por talle
                  </p>
                  {productSizes.map(s => (
                    <div key={s.name} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                      <span className="px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg min-w-[60px] text-center">
                        {s.name}
                      </span>
                      <input
                        type="number"
                        value={s.price}
                        onChange={e => updateSizeField(s.name, 'price', e.target.value)}
                        placeholder="Precio *"
                        min="0"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
                      />
                      <input
                        type="number"
                        value={s.compare_at_price}
                        onChange={e => updateSizeField(s.name, 'compare_at_price', e.target.value)}
                        placeholder="Precio anterior (Opcional)"
                        min="0"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSize(s.name)}
                        title="Quitar este talle"
                        aria-label={`Quitar talle ${s.name}`}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cada talle puede tener su propio precio y precio anterior (opcional).
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Distintivos</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setIsNew(v => !v)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                isNew
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}
            >
              {isNew ? '✓ ' : ''}Marcar como Nuevo
            </button>
            <button
              type="button"
              onClick={() => setIsBestSeller(v => !v)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                isBestSeller
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
              }`}
            >
              {isBestSeller ? '✓ ' : ''}Marcar como Más vendido
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Se muestran como badges en la card del producto.</p>
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
    </AdminShell>
  );
}
