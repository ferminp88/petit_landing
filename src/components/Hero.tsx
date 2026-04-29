import React from 'react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-bone">
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="md:col-span-5 order-2 md:order-1"
        >
          <img src="/logo.png" alt="Petit" className="w-28 h-auto mb-10" />

          <span className="block uppercase tracking-[0.25em] text-[11px] font-medium text-mocha mb-6">
            Hecho con amor
          </span>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-ink mb-8">
            accesorios para<br />
            tu <em className="italic font-light">mejor</em><br />
            <em className="italic font-light">compañía</em>
          </h1>

          <p className="text-mocha font-light text-base md:text-lg max-w-md mb-10 leading-relaxed">
            Una colección curada de collares, correas y accesorios diseñados para acompañar a quien siempre te acompaña.
          </p>

          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-3 px-9 py-4 bg-ink text-bone text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-mocha transition-colors"
          >
            Ver colección
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="md:col-span-7 order-1 md:order-2"
        >
          <div className="aspect-square w-full bg-sand overflow-hidden">
            <img
              src="/hero-product.jpg"
              alt=""
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
