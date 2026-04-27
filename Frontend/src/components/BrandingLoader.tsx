import React from 'react';
import { motion } from 'framer-motion';

const BrandingLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden">
      <div className="relative">

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-32 w-32 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center shadow-xl"
        >

          {/* Removed 3D text */}

        </motion.div>
      </div>

    </div>
  );
};

export default BrandingLoader;
