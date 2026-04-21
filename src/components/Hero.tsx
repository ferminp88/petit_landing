import React from 'react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1920&auto=format&fit=crop" 
          alt="Perro y gato relajados" 
          className="w-full h-full object-cover filter brightness-[0.9] saturate-[0.8]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-brand-cream/10 via-brand-cream/40 to-brand-cream" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          {/* Logo Principal Centrado */}
          <img
            src="/logo.png"
            alt="Petit Logo"
            className="w-48 md:w-64 h-auto drop-shadow-2xl"
          />
        </motion.div>

        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="uppercase tracking-[0.2em] text-xs font-bold text-brand-magenta mb-4 block"
        >
          Hecho a mano con amor
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl font-display font-bold mb-6 text-brand-dark leading-tight"
        >
          Accesorios únicos para tu <span className="text-gradient">mejor amigo</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg text-brand-dark/60 mb-10 font-light"
        >
          Explora nuestra colección boutique de collares, correas y accesorios diseñados para destacar.
        </motion.p>
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-10 py-4 bg-gradient text-white rounded-2xl text-sm font-bold tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-pink/30"
        >
          VER PRODUCTOS
        </motion.button>
      </div>
    </section>
  );
};
