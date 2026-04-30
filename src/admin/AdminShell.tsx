import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, Tag, Ruler, Megaphone } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const NAV_ITEMS = [
  { to: '/admin/products', label: 'Productos', icon: Package },
  { to: '/admin/categories', label: 'Categorías', icon: Tag },
  { to: '/admin/sizes', label: 'Talles', icon: Ruler },
  { to: '/admin/promotion', label: 'Novedades', icon: Megaphone },
];

interface AdminShellProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, actions, children }: AdminShellProps) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Package className="w-5 h-5 text-pink-400 flex-shrink-0" />
            <span className="font-display font-bold text-pink-400 tracking-widest text-lg">PETIT</span>
            {title && <span className="hidden sm:inline text-slate-400 text-sm truncate">· {title}</span>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={() => { logout(); navigate('/admin/login'); }}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Salir"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="px-2 flex gap-1 overflow-x-auto border-t border-slate-800">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  isActive
                    ? 'text-pink-400 border-pink-400'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 p-4 md:p-7 max-w-5xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
