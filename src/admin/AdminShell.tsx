import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, Tag, Ruler, Menu, X, Sparkles, ExternalLink, Image as ImageIcon, Megaphone } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

type NavColor = 'magenta' | 'orange' | 'sky' | 'violet' | 'emerald';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: NavColor;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/products', label: 'Productos', icon: Package, color: 'magenta' },
  { to: '/admin/categories', label: 'Categorías', icon: Tag, color: 'orange' },
  { to: '/admin/sizes', label: 'Talles', icon: Ruler, color: 'sky' },
  { to: '/admin/banners', label: 'Banners', icon: ImageIcon, color: 'emerald' },
  { to: '/admin/announcement-bar', label: 'Franja superior', icon: Megaphone, color: 'violet' },
];

const COLOR_STYLES: Record<NavColor, { active: string; inactive: string; iconBg: string; iconText: string }> = {
  magenta: {
    active: 'bg-pink-50 text-pink-700',
    inactive: 'text-slate-600 hover:bg-pink-50/50 hover:text-pink-700',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600',
  },
  orange: {
    active: 'bg-orange-50 text-orange-700',
    inactive: 'text-slate-600 hover:bg-orange-50/50 hover:text-orange-700',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
  },
  sky: {
    active: 'bg-sky-50 text-sky-700',
    inactive: 'text-slate-600 hover:bg-sky-50/50 hover:text-sky-700',
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-600',
  },
  violet: {
    active: 'bg-violet-50 text-violet-700',
    inactive: 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
  emerald: {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
};

interface AdminShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, subtitle, actions, children }: AdminShellProps) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-5 py-7 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-lg text-slate-900 tracking-wide">Petit Studio</p>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Panel admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          const style = COLOR_STYLES[item.color];
          return (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive ? style.active : style.inactive
              }`}
            >
              <span className={`w-8 h-8 rounded-lg ${style.iconBg} ${style.iconText} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </span>
          Ver tienda
        </a>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </span>
          Salir
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-bone flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 sticky top-0 h-screen flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl lg:hidden">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-bone/85 backdrop-blur-md border-b border-slate-100">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              <div className="min-w-0">
                {title && <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900 truncate">{title}</h1>}
                {subtitle && <p className="text-xs md:text-sm text-slate-500 truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
