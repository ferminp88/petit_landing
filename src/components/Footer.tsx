import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-white py-20 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h2 className="text-3xl font-display font-bold tracking-tight uppercase text-gradient">Petit</h2>
          <p className="text-sm text-white/60 leading-relaxed font-light">
            Creando momentos especiales para ti y tu mejor amigo con accesorios diseñados para durar.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-gradient transition-all">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white/30 mb-6 underline underline-offset-8">
            Colecciones
          </h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Collares</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Correas</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Arneses</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Ropa</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white/30 mb-6 underline underline-offset-8">
            Ayuda
          </h4>
          <ul className="space-y-3 text-sm text-white/60 text-left">
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Guía de Talles</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Métodos de Envío</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Preguntas Frecuentes</a></li>
            <li><a href="#" className="hover:text-brand-magenta transition-colors">Cambios y Devoluciones</a></li>
          </ul>
        </div>

        <div>
           <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white/30 mb-6 underline underline-offset-8">
            Contacto
          </h4>
          <ul className="space-y-4 text-sm text-white/60">
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-magenta" />
              hola@petit.com
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-magenta" />
              +54 9 11 1234-5678
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-brand-magenta" />
              Buenos Aires, Argentina
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 text-center">
        <p className="text-[10px] uppercase tracking-widest text-white/20">
          © {new Date().getFullYear()} Petit Accesorios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
