import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { adminFetchPromotion, adminUpdatePromotion } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminShell } from './AdminShell';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function resolveImage(url: string): string {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

export function AdminPromotion() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [currentImage, setCurrentImage] = useState('');
  const [clearImage, setClearImage] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string>('');

  const [description, setDescription] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    adminFetchPromotion()
      .then(p => {
        setCurrentImage(p.image || '');
        setDescription(p.description || '');
        setOldPrice(p.old_price !== null ? String(p.old_price) : '');
        setNewPrice(p.new_price !== null ? String(p.new_price) : '');
        setActive(p.active === 1);
      })
      .catch((err: any) => {
        if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    };
  }, [newPreview]);

  const percentOff = useMemo(() => {
    const oldN = parseInt(oldPrice);
    const newN = parseInt(newPrice);
    if (!isFinite(oldN) || !isFinite(newN) || oldN <= 0 || newN >= oldN) return null;
    return Math.round((1 - newN / oldN) * 100);
  }, [oldPrice, newPrice]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(f);
    setNewPreview(URL.createObjectURL(f));
    setClearImage(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClearImage() {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(null);
    setNewPreview('');
    setClearImage(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData();
    formData.append('description', description.trim());
    formData.append('old_price', oldPrice);
    formData.append('new_price', newPrice);
    formData.append('active', active ? '1' : '0');
    if (newFile) formData.append('image', newFile);
    if (clearImage && !newFile) formData.append('clear_image', '1');

    try {
      const updated = await adminUpdatePromotion(formData);
      setCurrentImage(updated.image || '');
      setClearImage(false);
      setNewFile(null);
      if (newPreview) URL.revokeObjectURL(newPreview);
      setNewPreview('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error guardando promoción');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Novedades">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const showCurrentImage = currentImage && !clearImage && !newPreview;
  const previewSrc = newPreview || (showCurrentImage ? resolveImage(currentImage) : '');

  return (
    <AdminShell title="Novedades">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="font-bold text-slate-800 mb-1">Banner de Novedades</h2>
          <p className="text-xs text-slate-500">
            Esta promoción se muestra en el panel derecho del Hero. Para que aparezca tenés que activarla con el switch de abajo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Imagen
            </label>
            {previewSrc ? (
              <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white shadow-md"
                  title="Quitar imagen"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                {newPreview && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-pink-100 text-pink-600 text-[9px] font-bold rounded uppercase tracking-wider">
                    Nueva
                  </span>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 transition-colors text-slate-400"
              >
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Subir foto</p>
                <p className="text-[10px] mt-1 opacity-70">JPG, PNG, WEBP — máx. 5 MB</p>
              </div>
            )}
            {previewSrc && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 w-full py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cambiar imagen
              </button>
            )}
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej: 20% off en este producto"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Precio antes ($)
                </label>
                <input
                  type="number"
                  value={oldPrice}
                  onChange={e => setOldPrice(e.target.value)}
                  min="0"
                  placeholder="6000"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Precio ahora ($)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  min="0"
                  placeholder="4800"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            {percentOff !== null && (
              <div className="rounded-xl bg-pink-50 border border-pink-100 px-4 py-3 text-sm">
                <span className="font-bold text-pink-600">−{percentOff}% OFF</span>
                <span className="text-pink-500/80 ml-2">se calcula automáticamente.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActive(a => !a)}
            className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${active ? 'bg-green-500' : 'bg-slate-300'}`}
            aria-pressed={active}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {active ? <><Eye className="w-4 h-4 text-green-500" /> Visible en la home</> : <><EyeOff className="w-4 h-4 text-slate-400" /> Oculta en la home</>}
          </span>
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">✓ Cambios guardados</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-gradient text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
