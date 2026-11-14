// src/components/layout/BottomNav.tsx: Мобильная нижняя панель навигации (5 основных вкладок)

import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Boxes, BookOpen, Wine, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { UserRole } from '../../types';

interface BottomNavProps {
  userRole?: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = () => {
  const location = useLocation();
  const navContainerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', label: 'Склад', icon: Boxes, end: true },
    { to: '/recipes', label: 'Рецепты', icon: BookOpen },
    { to: '/batches', label: 'Настойки', icon: Wine },
    { to: '/transfers', label: 'Перемещения', icon: ArrowLeftRight },
    { to: '/statistics', label: 'Аналитика', icon: BarChart3 },
  ];

  // Автоскролл активной вкладки в область видимости при необходимости
  useEffect(() => {
    if (navContainerRef.current) {
      const activeEl = navContainerRef.current.querySelector('.bottom-nav-active') as HTMLElement | null;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [location.pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-surface-dark-card/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800 pb-safe shadow-lg">
      <div
        ref={navContainerRef}
        className="max-w-xl mx-auto grid grid-cols-5 items-center px-1 py-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bottom-nav-active text-brand-primary dark:text-brand-amber font-bold scale-105'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
