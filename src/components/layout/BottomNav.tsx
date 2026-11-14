// src/components/layout/BottomNav.tsx: Мобильная нижняя панель навигации

import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Boxes, BookOpen, Wine, ArrowLeftRight, BarChart3, Users, Bot, Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

interface BottomNavProps {
  userRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ userRole }) => {
  const isOwner = userRole === 'owner';
  const location = useLocation();
  const navContainerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', label: 'Склад', icon: Boxes, end: true },
    { to: '/showcase', label: 'Витрина', icon: Sparkles },
    { to: '/recipes', label: 'Рецепты', icon: BookOpen },
    { to: '/batches', label: 'Настойки', icon: Wine },
    { to: '/transfers', label: 'Перемещ.', icon: ArrowLeftRight },
    { to: '/statistics', label: 'Аналитика', icon: BarChart3 },
    ...(isOwner ? [{ to: '/team', label: 'Команда', icon: Users }] : []),
    { to: '/assistant', label: 'AI Чат', icon: Bot },
  ];

  // Автоскролл активной вкладки в область видимости на мобильных экранах
  useEffect(() => {
    if (navContainerRef.current) {
      const activeEl = navContainerRef.current.querySelector('.bottom-nav-active') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [location.pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-surface-dark-card/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800 pb-safe shadow-lg">
      <div
        ref={navContainerRef}
        className="max-w-2xl mx-auto flex items-center justify-between sm:justify-around px-1.5 sm:px-3 py-1 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-xl transition-all duration-200 shrink-0 sm:shrink min-w-[52px] sm:min-w-0 sm:flex-1 ${
                  isActive
                    ? 'bottom-nav-active text-brand-primary dark:text-brand-amber font-bold scale-105'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium'
                }`
              }
            >
              <Icon size={19} strokeWidth={2.2} />
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
