import React from 'react';
import { motion } from 'framer-motion';

const BrandingLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden">
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-orange-500 blur-[80px] rounded-full"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-32 w-32 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center shadow-xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-slate-900 font-black text-4xl italic tracking-tighter"
          >
            3D
          </motion.span>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <motion.circle
              cx="64" cy="64" r="60"
              stroke="url(#grad)" strokeWidth="4" fill="transparent"
              strokeDasharray="377"
              initial={{ strokeDashoffset: 377 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-12 text-center"
      >
        <h1 className="text-slate-900 font-black text-2xl tracking-[0.4em] uppercase">
          3D<span className="text-orange-500">shop</span>
        </h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-[0.6em] mt-3 uppercase">
          Initializing Premium Suite
        </p>
      </motion.div>
    </div>
  );
};

export default BrandingLoader;
