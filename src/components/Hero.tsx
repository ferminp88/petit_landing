import React from 'react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-brand-cream">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.95)_0%,_rgba(255,255,255,0)_65%)]" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />

      <div className="relative z-10 text-center px-4 max-w-3xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <img
            src="/logo.png"
            alt="Petit Logo"
            className="w-48 md:w-64 h-auto drop-shadow-xl"
          />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="uppercase tracking-[0.2em] text-xs font-bold text-brand-magenta mb-4 block"
        >
          Hecho con amor
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-6xl font-display font-bold mb-6 text-brand-dark leading-tight lowercase"
        >
          accesorios para tu <span className="text-gradient">mejor compañía</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg text-brand-dark/60 mb-10 font-light"
        >
          Explora nuestra colección de collares, correas y accesorios diseñados para destacar.
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
