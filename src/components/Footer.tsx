import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-bone py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-6">
          <h2 className="text-3xl font-display tracking-tight uppercase text-gradient">Petit</h2>
          <p className="text-sm text-bone/60 leading-relaxed font-light max-w-xs">
            Creando momentos especiales para vos y tu mejor amigo con accesorios diseñados para durar.
          </p>
          <div className="flex gap-3">
            <a
              href="https://instagram.com/accesorios.petit"
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-bone/10 hover:bg-petit transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-[0.22em] text-bone mb-6">
            Colecciones
          </h4>
          <ul className="space-y-3 text-sm text-bone/60 font-light">
            <li><a href="#" className="hover:text-petit transition-colors">Collares</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Correas</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Arneses</a></li>
            <li><a href="#" className="hover:text-petit transition-colors">Ropa</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-[0.22em] text-bone mb-6">
            Contacto
          </h4>
          <ul className="space-y-4 text-sm text-bone/60 font-light">
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-petit" />
              hola@petit.com
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-petit" />
              +54 9 11 1234-5678
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-petit" />
              Buenos Aires, Argentina
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-bone/10 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-bone/30 font-sans">
          © {new Date().getFullYear()} Petit Accesorios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
