import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="bg-bone py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-ink min-h-[420px] md:min-h-[480px] shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="p-8 md:p-14 flex flex-col justify-center text-white relative overflow-hidden"
        >
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-gradient opacity-20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-gradient opacity-20 blur-3xl pointer-events-none" />

          <span className="relative inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.22em] font-bold mb-6">
            ✦ Nueva colección
          </span>

          <h1 className="relative font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6 lowercase">
            accesorios para <span className="text-gradient">tu mejor compañía</span>
          </h1>

          <p className="relative text-white/70 text-base md:text-lg font-light max-w-md mb-8 leading-relaxed">
            Descubrí nuestra colección de collares, correas y accesorios diseñados para acompañar a tu mejor amigo.
          </p>

          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="relative self-start inline-flex items-center gap-2 px-7 py-3.5 bg-gradient text-white rounded-full text-sm font-bold tracking-wide hover:brightness-110 transition-all shadow-xl shadow-brand-magenta/30"
          >
            Ver productos
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative bg-sand min-h-[280px] md:min-h-full overflow-hidden flex items-center justify-center p-8 md:p-12"
        >
          <img
            src="/hero-product.jpg"
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient opacity-30 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-brand-orange/30 blur-2xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
            <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur text-[10px] uppercase tracking-[0.22em] font-bold text-brand-magenta mb-5 shadow-sm">
              ✦ Novedades
            </span>

            <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-full bg-white/70 backdrop-blur shadow-2xl flex items-center justify-center mb-5 border border-white/60">
              <span className="font-display font-bold text-7xl md:text-8xl text-gradient leading-none">P</span>
              <span className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-gradient text-white text-xs font-bold shadow-lg rotate-12">
                -20%
              </span>
            </div>

            <p className="font-display font-bold text-2xl md:text-3xl text-ink leading-tight mb-2">
              Colección primavera
            </p>
            <p className="text-sm text-ink/60 font-light max-w-[260px]">
              Hasta 20% de descuento en accesorios seleccionados.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
