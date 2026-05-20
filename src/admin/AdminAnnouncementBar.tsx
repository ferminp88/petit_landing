import React, { useEffect, useState } from 'react';
import { Plus, X, Megaphone } from 'lucide-react';
import { AdminShell } from './AdminShell';
import { adminFetchAnnouncementBar, adminUpdateAnnouncementBar } from './adminApi';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';

export function AdminAnnouncementBar() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    adminFetchAnnouncementBar()
      .then(data => {
        setMessages(data.messages.length > 0 ? data.messages : ['']);
        setActive(data.active === 1);
        setSpeed(data.speed_seconds || 30);
      })
      .catch((err: any) => {
        if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateMessage(index: number, value: string) {
    setMessages(prev => prev.map((m, i) => i === index ? value : m));
  }
  function removeMessage(index: number) {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }
  function addMessage() {
    setMessages(prev => [...prev, '']);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const clean = messages.map(m => m.trim()).filter(Boolean);
      const res = await adminUpdateAnnouncementBar({
        messages: clean,
        active: active ? 1 : 0,
        speed_seconds: speed,
      });
      setMessages(res.messages.length > 0 ? res.messages : ['']);
      setSavedAt(Date.now());
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') { logout(); navigate('/admin/login'); return; }
      setError(err.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Franja superior" subtitle="Texto que se desliza arriba del navbar">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Franja superior" subtitle="Mensajes que se deslizan arriba del navbar">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">

        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-900">Mostrar franja en la web</p>
            <p className="text-xs text-slate-500 mt-0.5">Si está apagada, no aparece aunque haya mensajes.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive(v => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Mensajes
          </label>
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={m}
                  onChange={e => updateMessage(i, e.target.value)}
                  placeholder="Ej: Envío gratis en compras superiores a $20.000"
                  maxLength={200}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                />
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMessage(i)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Quitar mensaje"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMessage}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar mensaje
          </button>
          <p className="text-[10px] text-slate-400 mt-2">
            Si cargás varios mensajes, se concatenan con un separador (•) y desfilan juntos.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Velocidad (segundos por vuelta) — {speed}s
          </label>
          <input
            type="range"
            min={5}
            max={120}
            value={speed}
            onChange={e => setSpeed(parseInt(e.target.value) || 30)}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Rápido (5s)</span>
            <span>Lento (120s)</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        {savedAt && !error && (
          <p className="text-sm text-emerald-600 font-medium">✓ Guardado</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </AdminShell>
  );
}
