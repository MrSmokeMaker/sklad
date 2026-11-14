// src/components/common/SegmentedControl.tsx: Сегментный переключатель (паттерн Apple Fitness / iOS)

import React from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: number | string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = ''
}: SegmentedControlProps<T>) {
  return (
    <div className={`relative flex items-center bg-stone-200/70 dark:bg-stone-800/80 p-1 rounded-xl select-none ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex-1 py-1.5 px-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 z-10 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isSelected
                ? 'text-brand-primary-dark dark:text-stone-100'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {opt.label}
            {opt.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected
                  ? 'bg-brand-primary text-white'
                  : 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}>
                {opt.badge}
              </span>
            )}

            {isSelected && (
              <motion.div
                layoutId="active-segmented-pill"
                className="absolute inset-0 bg-white dark:bg-stone-700 rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
