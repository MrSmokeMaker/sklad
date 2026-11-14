// src/components/branding/LogoMark.tsx: Компонент логотипа «Мордовское подворье» в трех режимах

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type LogoMode = 'splash' | 'ambient' | 'pulse-on-tap' | 'static';

interface LogoMarkProps {
  mode?: LogoMode;
  size?: number;
  className?: string;
  onTap?: () => void;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  mode = 'static',
  size = 48,
  className = '',
  onTap
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isTapped, setIsTapped] = useState(false);

  const handleTap = () => {
    if (mode === 'pulse-on-tap') {
      setIsTapped(true);
      setTimeout(() => setIsTapped(false), 500);
    }
    if (onTap) onTap();
  };

  // 16 точек по кругу с радиусом 216
  const berries = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * 22.5 * Math.PI) / 180;
    const cx = 256 + 216 * Math.cos(angle);
    const cy = 256 + 216 * Math.sin(angle);
    return { cx, cy, index: i };
  });

  return (
    <div
      onClick={handleTap}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${mode === 'pulse-on-tap' ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      title="Мордовское подворье"
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <radialGradient id="logoCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FAF7F2" />
            <stop offset="85%" stopColor="#F5EFE0" />
            <stop offset="100%" stopColor="#E8A33D" />
          </radialGradient>
        </defs>

        {/* Внешний обруч */}
        <motion.circle
          cx="256"
          cy="256"
          r="216"
          fill="none"
          stroke="#5A1010"
          strokeWidth="6"
          strokeDasharray="10 8"
          initial={mode === 'splash' && !shouldReduceMotion ? { pathLength: 0, opacity: 0 } : false}
          animate={mode === 'splash' && !shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* 16 ягод-точек */}
        <g id="berries-group">
          {berries.map(({ cx, cy, index }) => (
            <g key={index}>
              <motion.circle
                cx={cx}
                cy={cy}
                r="10"
                fill="#8B1A1A"
                initial={mode === 'splash' && !shouldReduceMotion ? { scale: 0, opacity: 0 } : false}
                animate={
                  isTapped
                    ? { scale: [1, 1.4, 1], opacity: 1 }
                    : mode === 'splash' && !shouldReduceMotion
                    ? { scale: 1, opacity: 1 }
                    : { opacity: 1 }
                }
                transition={{
                  delay: isTapped ? index * 0.025 : mode === 'splash' ? 0.05 * index : 0,
                  duration: isTapped ? 0.3 : 0.4
                }}
              />
              <circle cx={cx} cy={cy} r="4.5" fill="#E8A33D" />
            </g>
          ))}
        </g>

        {/* Центральные солярные звёзды */}
        <motion.g
          transform="translate(256, 256)"
          initial={
            mode === 'splash' && !shouldReduceMotion
              ? { rotate: -180, scale: 0.2, opacity: 0 }
              : false
          }
          animate={
            mode === 'ambient' && !shouldReduceMotion
              ? { rotate: 360 }
              : mode === 'splash' && !shouldReduceMotion
              ? { rotate: 0, scale: 1, opacity: 1 }
              : isTapped
              ? { scale: [1, 1.08, 1] }
              : { rotate: 0, scale: 1, opacity: 1 }
          }
          transition={
            mode === 'ambient' && !shouldReduceMotion
              ? { repeat: Infinity, duration: 80, ease: 'linear' }
              : mode === 'splash'
              ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.3 }
          }
        >
          {/* Внешняя красная 8-конечная звезда */}
          <path
            d="M 0,-185 L 36,-65 L 185,0 L 65,36 L 0,185 L -36,65 L -185,0 L -65,-36 Z"
            fill="#8B1A1A"
            stroke="#5A1010"
            strokeWidth="4"
          />
          <path
            d="M -131,-131 L -25,-75 L 0,-185 L 25,-75 L 131,-131 L 75,-25 L 185,0 L 75,25 L 131,131 L 25,75 L 0,185 L -25,75 L -131,131 L -75,25 L -185,0 L -75,-25 Z"
            fill="#8B1A1A"
            opacity="0.95"
          />

          {/* Внутренняя янтарная звезда со смещением 22.5° */}
          <g transform="rotate(22.5)">
            <path
              d="M 0,-138 L 26,-48 L 138,0 L 48,26 L 0,138 L -26,48 L -138,0 L -48,-26 Z"
              fill="#E8A33D"
              stroke="#8B1A1A"
              strokeWidth="2"
            />
            <path
              d="M -98,-98 L -18,-56 L 0,-138 L 18,-56 L 98,-98 L 56,-18 L 138,0 L 56,18 L 98,98 L 18,56 L 0,138 L -18,56 L -98,98 L -56,18 L -138,0 L -56,-18 Z"
              fill="#E8A33D"
              opacity="0.9"
            />
          </g>
        </motion.g>

        {/* Кремовое пульсирующее ядро (неподвижно в центре) */}
        <motion.g
          transform="translate(256, 256)"
          animate={
            mode === 'ambient' && !shouldReduceMotion
              ? { scale: [1, 1.08, 1] }
              : isTapped
              ? { scale: [1, 1.15, 1] }
              : {}
          }
          transition={
            mode === 'ambient' && !shouldReduceMotion
              ? { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          <circle cx="0" cy="0" r="48" fill="url(#logoCoreGrad)" stroke="#E8A33D" strokeWidth="5" />
          <circle cx="0" cy="0" r="32" fill="#FAF7F2" />
          {/* Тёмно-красная точка в центре */}
          <circle cx="0" cy="0" r="14" fill="#8B1A1A" />
          <circle cx="0" cy="0" r="5" fill="#E8A33D" />
        </motion.g>
      </svg>
    </div>
  );
};
