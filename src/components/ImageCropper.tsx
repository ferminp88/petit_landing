import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  file: File;
  aspect?: number;
  title?: string;
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
}

async function getCroppedFile(srcUrl: string, area: Area, originalName: string, mime: string): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = srcUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('blob'))), mime, 0.92);
  });
  const ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
  const baseName = originalName.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}-cropped${ext}`, { type: mime });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ file, aspect = 1, title = 'Ajustar imagen', onConfirm, onCancel }) => {
  const [srcUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelArea, setPixelArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => () => URL.revokeObjectURL(srcUrl), [srcUrl]);

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setPixelArea(area);
  }, []);

  async function handleConfirm() {
    if (!pixelArea) return;
    setBusy(true);
    try {
      const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
      const cropped = await getCroppedFile(srcUrl, pixelArea, file.name, mime);
      onConfirm(cropped);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Cerrar">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="relative bg-slate-900" style={{ height: 'min(60vh, 500px)' }}>
          <Cropper
            image={srcUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Zoom</label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">Arrastrá la imagen y usá el zoom para encuadrarla. Aspecto: {aspect === 1 ? '1:1' : `${aspect.toFixed(2)}:1`}.</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy || !pixelArea}
              className="flex-[2] py-2.5 bg-pink-500 text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {busy ? 'Procesando...' : 'Aplicar recorte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
