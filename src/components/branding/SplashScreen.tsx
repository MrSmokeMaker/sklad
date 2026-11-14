// src/components/branding/SplashScreen.tsx: Заставочный сплэш-экран PWA

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from './LogoMark';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1450);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        onClick={onFinish}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#5A1010] via-[#8B1A1A] to-[#FAF7F2] p-6 text-center select-none cursor-pointer"
      >
        <div className="flex flex-col items-center max-w-sm">
          <LogoMark mode="splash" size={160} className="mb-6 shadow-2xl rounded-full bg-surface-bg/10 p-2" />

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <span className="text-brand-amber text-xs font-semibold uppercase tracking-widest mb-1">
              Сеть ресторанов
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
              Мордовское подворье
            </h1>
            <p className="text-sm font-medium text-amber-100/90 mt-1">
              Производство и склад настоек
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
