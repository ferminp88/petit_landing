import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, X } from 'lucide-react';

export type PriceRange = { id: string; label: string; min: number; max: number };

export const PRICE_RANGES: PriceRange[] = [
  { id: 'any',    label: 'Cualquier precio',    min: 0,     max: Infinity },
  { id: 'lt2k',   label: 'Hasta $2.000',        min: 0,     max: 2000 },
  { id: '2k-5k',  label: '$2.000 — $5.000',     min: 2000,  max: 5000 },
  { id: '5k-10k', label: '$5.000 — $10.000',    min: 5000,  max: 10000 },
  { id: 'gt10k',  label: 'Más de $10.000',      min: 10000, max: Infinity },
];

interface DropdownProps {
  label: string;
  isActive: boolean;
  value: string;
  displayValue: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}

function Dropdown({ label, isActive, value, displayValue, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
          isActive
            ? 'bg-gradient text-white shadow-md shadow-brand-pink/20'
            : 'bg-black/5 text-brand-dark/70 hover:bg-black/10'
        }`}
      >
        <span className={`uppercase tracking-wider text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{label}</span>
        <span className="font-bold max-w-[120px] truncate">{displayValue}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 min-w-[180px] bg-white rounded-xl shadow-xl border border-black/5 overflow-hidden z-30"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-left transition-colors ${
                  value === opt.id ? 'bg-brand-pink/10 text-brand-magenta' : 'text-brand-dark/70 hover:bg-black/5'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FiltersProps {
  categories: string[];
  sizes: string[];
  category: string;
  size: string;
  priceRangeId: string;
  onCategoryChange: (c: string) => void;
  onSizeChange: (s: string) => void;
  onPriceRangeChange: (id: string) => void;
  onClear: () => void;
}

export function Filters(props: FiltersProps) {
  const {
    categories, sizes,
    category, size, priceRangeId,
    onCategoryChange, onSizeChange, onPriceRangeChange, onClear,
  } = props;

  const catOptions = [{ id: 'Todos', label: 'Todas' }, ...categories.map(c => ({ id: c, label: c }))];
  const sizeOptions = [{ id: 'Todos', label: 'Todos' }, ...sizes.map(s => ({ id: s, label: s }))];
  const priceOptions = PRICE_RANGES.map(r => ({ id: r.id, label: r.label }));

  const catDisplay = category === 'Todos' ? 'Todas' : category;
  const sizeDisplay = size === 'Todos' ? 'Todos' : size;
  const priceDisplay = PRICE_RANGES.find(r => r.id === priceRangeId)?.label ?? 'Cualquier precio';

  const anyActive = category !== 'Todos' || size !== 'Todos' || priceRangeId !== 'any';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown
        label="Categoría"
        isActive={category !== 'Todos'}
        value={category}
        displayValue={catDisplay}
        options={catOptions}
        onChange={onCategoryChange}
      />
      {sizes.length > 0 && (
        <Dropdown
          label="Talle"
          isActive={size !== 'Todos'}
          value={size}
          displayValue={sizeDisplay}
          options={sizeOptions}
          onChange={onSizeChange}
        />
      )}
      <Dropdown
        label="Precio"
        isActive={priceRangeId !== 'any'}
        value={priceRangeId}
        displayValue={priceDisplay}
        options={priceOptions}
        onChange={onPriceRangeChange}
      />
      {anyActive && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-bold text-brand-dark/50 hover:text-brand-dark hover:bg-black/5 transition-all"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}
