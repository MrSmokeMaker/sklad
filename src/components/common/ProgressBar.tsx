// src/components/common/ProgressBar.tsx: Прогресс-бар остатков с цветовой шкалой

import React from 'react';

interface ProgressBarProps {
  current: number;
  minStock: number;
  maxExpected?: number; // По умолчанию 2 * minStock
  unit?: string;
  showLabels?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  minStock,
  maxExpected,
  unit = '',
  showLabels = true,
  className = ''
}) => {
  const safeCurrent = Math.max(0, current);
  const baselineMax = maxExpected || Math.max(minStock * 2.5, safeCurrent, 10);
  const percent = Math.min(100, Math.round((safeCurrent / baselineMax) * 100));

  // Правила цвета:
  // - Красный: ниже min_stock
  // - Желтый: выше min_stock, но <= 50%
  // - Зеленый: > 50%
  let colorClass = 'bg-emerald-500';
  let statusText = 'В норме';

  if (safeCurrent < minStock || current <= 0) {
    colorClass = 'bg-rose-500';
    statusText = 'Заканчивается!';
  } else if (percent <= 50) {
    colorClass = 'bg-amber-500';
    statusText = 'Требует внимания';
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1 font-medium">
          <span className="text-stone-500 dark:text-stone-400">
            Остаток: <strong className="text-stone-800 dark:text-stone-200">{current} {unit}</strong>
          </span>
          <span className={`text-[11px] font-semibold ${
            safeCurrent < minStock ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-stone-500 dark:text-stone-400'
          }`}>
            {statusText} (мин: {minStock} {unit})
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
