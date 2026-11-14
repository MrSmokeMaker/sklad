// src/components/layout/Header.tsx: Шапка приложения с поправленным логотипом и верхними кнопками навигации

import React from 'react';
import { LogoMark } from '../branding/LogoMark';
import { Moon, Sun, Sparkles, Bot, User } from 'lucide-react';
import { Venue, Profile } from '../../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  venues?: Venue[];
  activeVenueId?: string;
  onVenueChange?: (venueId: string) => void;
  currentProfile?: Profile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMock?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isShowcaseActive = location.pathname === '/showcase';
  const isAssistantActive = location.pathname === '/assistant';
  const isProfileActive = location.pathname === '/profile';

  return (
    <header className="sticky top-0 z-40 bg-[#5A1010] border-b border-red-950/60 text-white shadow-md pt-safe">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Поправленный солярный логотип сети (центрированная звезда) */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-95 transition-opacity focus:outline-none"
          title="На главную (Склад)"
        >
          <LogoMark
            mode="ambient"
            size={36}
            className="shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              Настойки
            </h1>
            <p className="text-[10px] sm:text-[11px] text-amber-100/90 font-medium truncate leading-tight">
              Мордовское подворье
            </p>
          </div>
        </button>

        {/* Наверху на всех страницах только: Витрина, ИИ помощник, Светлая/темная тема, Профиль */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Витрина */}
          <button
            onClick={() => navigate('/showcase')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isShowcaseActive
                ? 'bg-amber-400 text-stone-900 shadow-sm font-bold scale-102'
                : 'bg-white/10 hover:bg-white/20 text-amber-100 backdrop-blur-sm'
            }`}
            title="Гостевая витрина настоек"
          >
            <Sparkles size={16} className={isShowcaseActive ? 'text-stone-900' : 'text-amber-300'} />
            <span className="hidden xs:inline">Витрина</span>
          </button>

          {/* ИИ помощник */}
          <button
            onClick={() => navigate('/assistant')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAssistantActive
                ? 'bg-amber-400 text-stone-900 shadow-sm font-bold scale-102'
                : 'bg-white/10 hover:bg-white/20 text-amber-100 backdrop-blur-sm'
            }`}
            title="AI Бар-помощник"
          >
            <Bot size={16} className={isAssistantActive ? 'text-stone-900' : 'text-amber-300'} />
            <span className="hidden xs:inline">ИИ Помощник</span>
          </button>

          {/* Светлая / тёмная тема */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
            aria-label="Переключить тему оформления"
          >
            {darkMode ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} />}
          </button>

          {/* Профиль */}
          <button
            onClick={() => navigate('/profile')}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isProfileActive
                ? 'bg-amber-400 text-stone-900 shadow-sm font-bold scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
            }`}
            title="Профиль и команда"
          >
            <User size={17} className={isProfileActive ? 'text-stone-900' : 'text-white'} />
            <span className="hidden sm:inline">Профиль</span>
          </button>
        </div>
      </div>
    </header>
  );
};
