import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Trash2, Edit2, Power, X } from 'lucide-react';
import {
  adminFetchBanners, adminCreateBanner, adminUpdateBanner,
  adminToggleBanner, adminDeleteBanner,
  adminFetchCategories, AdminBanner, BannerType, AdminCategory,
} from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminShell } from './AdminShell';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function resolveImage(url: string): string {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

interface BannerFormState {
  title: string;
  subtitle: string;
  link: string;
  position: string;
  active: boolean;
}

const EMPTY_FORM: BannerFormState = {
  title: '', subtitle: '', link: '', position: '0', active: true,
};

export function AdminBanners() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<BannerType>('promo');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BannerFormState>(EMPTY_FORM);
  const [currentImage, setCurrentImage] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sorted = useMemo(
    () => [...banners].sort((a, b) => a.position - b.position || a.id - b.id),
    [banners]
  );

  async function load() {
    setLoading(true);
    try {
      const [bs, cs] = await Promise.all([adminFetchBanners(), adminFetchCategories()]);
      setBanners(bs);
      setCategories(cs);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (newPreview) URL.revokeObjectURL(newPreview); }, [newPreview]);

  function startCreate() {
    setEditingId(null);
    setEditingType('promo');
    setForm({ ...EMPTY_FORM, position: String(banners.length) });
    setCurrentImage('');
    setNewFile(null);
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewPreview('');
    setError('');
    setShowForm(true);
  }

  function startEdit(b: AdminBanner) {
    setEditingId(b.id);
    setEditingType(b.type);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      link: b.link || '',
      position: String(b.position),
      active: b.active === 1,
    });
    setCurrentImage(b.image);
    setNewFile(null);
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewPreview('');
    setError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setNewFile(null);
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewPreview('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(f);
    setNewPreview(URL.createObjectURL(f));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleToggle(id: number) {
    try {
      const updated = await adminToggleBanner(id);
      setBanners(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar banner "${title || '(sin título)'}"?`)) return;
    try {
      await adminDeleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!editingId && !newFile) {
      setError('La imagen es requerida.');
      return;
    }

    const fd = new FormData();
    fd.append('type', editingType);
    fd.append('title', form.title.trim());
    fd.append('subtitle', form.subtitle.trim());
    fd.append('link', form.link.trim());
    fd.append('position', form.position || '0');
    fd.append('active', form.active ? '1' : '0');
    if (newFile) fd.append('image', newFile);

    setSubmitting(true);
    try {
      const saved = editingId
        ? await adminUpdateBanner(editingId, fd)
        : await adminCreateBanner(fd);
      setBanners(prev => {
        const next = prev.filter(b => b.id !== saved.id);
        return [...next, saved];
      });
      cancelForm();
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error guardando banner');
    } finally {
      setSubmitting(false);
    }
  }

  const previewSrc = newPreview || (currentImage ? resolveImage(currentImage) : '');

  const newButton = !showForm && (
    <button
      onClick={startCreate}
      className="flex items-center gap-1.5 bg-gradient text-white px-4 py-2.5 rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-pink-500/30"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Nuevo banner</span>
      <span className="sm:hidden">Nuevo</span>
    </button>
  );

  return (
    <AdminShell title="Banners" subtitle="Slides del carrusel principal de la home (apaisados 16:9)" actions={newButton}>
      {/* FORM (inline) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 mb-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-900">
              {editingId ? 'Editar banner' : 'Nuevo banner'}
            </h2>
            <button type="button" onClick={cancelForm} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingType('category')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                  editingType === 'category' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                }`}
              >
                Categoría
              </button>
              <button
                type="button"
                onClick={() => setEditingType('promo')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                  editingType === 'promo' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
              >
                Promo
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Etiqueta para organizar internamente. Todos los banners activos se mezclan en el mismo carrusel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Imagen */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Imagen apaisada *</label>
              {previewSrc ? (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/95 backdrop-blur rounded-lg text-xs font-bold text-slate-700 hover:bg-white shadow-md"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="aspect-[16/9] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 transition-colors text-slate-400"
                >
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Subir imagen</p>
                  <p className="text-[10px] mt-1 opacity-70 text-center px-4">
                    Recomendado apaisada 16:9 (ej. 1920×1080) · JPG/PNG/WEBP · máx. 5 MB
                  </p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
            </div>

            {/* Campos */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={editingType === 'category' ? 'Ej: Perros' : 'Ej: 30% OFF en arneses'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder={editingType === 'category' ? 'Ej: Collares, arneses y más' : 'Ej: Hasta el 31 de mayo'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Filtra por categoría (al hacer click)
                </label>
                <select
                  value={form.link}
                  onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 bg-white"
                >
                  <option value="">— Solo scroll al catálogo —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Al clickear el banner, hace scroll al catálogo y aplica este filtro.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Orden</label>
                  <input
                    type="number"
                    value={form.position}
                    onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    min="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Menor = primero</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Visibilidad</label>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                    className={`w-full h-[46px] rounded-xl text-sm font-bold transition-colors ${
                      form.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {form.active ? '✓ Visible' : 'Oculto'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={cancelForm}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-3 bg-gradient text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear banner'}
            </button>
          </div>
        </form>
      )}

      {/* LISTA */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Aún no hay banners.
            <br />
            <button onClick={startCreate} className="mt-3 inline-flex items-center gap-1.5 text-pink-600 font-bold hover:underline">
              <Plus className="w-4 h-4" /> Crear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sorted.map(b => (
                <div key={b.id} className="p-4 md:p-5 flex gap-4 items-center">
                  <img
                    src={resolveImage(b.image) || 'https://placehold.co/80x80/f5f1ea/94a3b8?text=?'}
                    alt={b.title}
                    className="w-24 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-800 truncate">{b.title || '(sin título)'}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        b.type === 'category' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.type === 'category' ? 'Categoría' : 'Promo'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        b.active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {b.active === 1 ? 'Visible' : 'Oculto'}
                      </span>
                      {b.link && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                          → {b.link}
                        </span>
                      )}
                    </div>
                    {b.subtitle && <p className="text-xs text-slate-500 truncate">{b.subtitle}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">Orden: {b.position}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(b)} className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(b.id)}
                      className={`p-2 rounded-xl ${b.active === 1 ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      title={b.active === 1 ? 'Ocultar' : 'Mostrar'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(b.id, b.title)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

