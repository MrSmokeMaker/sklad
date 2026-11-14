// src/components/layout/Header.tsx: Шапка приложения с солярным логотипом и градиентом

import React, { useRef, useState } from 'react';
import { LogoMark } from '../branding/LogoMark';
import { Moon, Sun, Sparkles, Building2, Download, Upload, Database } from 'lucide-react';
import { Venue, Profile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../db/dataService';

interface HeaderProps {
  venues: Venue[];
  activeVenueId: string;
  onVenueChange: (venueId: string) => void;
  currentProfile: Profile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMock: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  venues,
  activeVenueId,
  onVenueChange,
  currentProfile,
  darkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwner = currentProfile.role === 'owner';

  const handleDownloadBackup = async () => {
    const jsonStr = await dataService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sklad_Nastoyki_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await dataService.importBackup(content);
      if (success) {
        alert('База данных успешно восстановлена из файла резервной копии!');
        window.location.reload();
      } else {
        alert('Не удалось прочитать файл резервной копии. Проверьте формат JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-brand-primary-dark via-brand-primary to-brand-amber text-white shadow-md">
      {/* Мягкий декоративный радиальный свет */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-amber/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Логотип + заголовок сети */}
          <div className="flex items-center gap-3">
            <LogoMark
              mode="ambient"
              size={40}
              onTap={() => navigate('/assistant')}
              className="cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
                  Настойки
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-amber text-brand-primary-dark uppercase">
                  {currentProfile.role}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-400/30">
                  Local DB
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                Мордовское подворье
              </p>
            </div>
          </div>

          {/* Правая панель кнопок */}
          <div className="flex items-center gap-1.5">
            {/* Статус локальной БД */}
            <div
              className="px-2 py-1.5 rounded-xl bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-sm flex items-center gap-1"
              title="Локальная база данных (IndexedDB + localStorage)"
            >
              <Database size={15} className="text-emerald-300" />
              <span className="hidden sm:inline">Локальная БД</span>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title="Скачать резервную копию базы (JSON)"
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title="Восстановить базу из файла JSON"
            >
              <Upload size={16} />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </button>

            <button
              onClick={() => navigate('/assistant')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 transition-colors backdrop-blur-sm flex items-center gap-1 text-xs font-semibold"
              title="AI Бар-помощник"
            >
              <Sparkles size={16} className="text-brand-amber animate-pulse" />
              <span className="hidden sm:inline">Ассистент</span>
            </button>

            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
            >
              {darkMode ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} />}
            </button>
          </div>
        </div>

        {/* Селектор заведения */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <Building2 size={15} className="text-amber-200 shrink-0" />
          {isOwner ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
              {venues.map((v) => {
                const isActive = v.id === activeVenueId;
                return (
                  <button
                    key={v.id}
                    onClick={() => onVenueChange(v.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-brand-primary-dark shadow-sm scale-102'
                        : 'bg-black/20 text-white/90 hover:bg-black/30'
                    }`}
                  >
                    {v.name}
                    {v.kind === 'production' && ' (База)'}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-xs font-semibold text-white">
              Заведение: {venues.find(v => v.id === activeVenueId)?.name || 'Не указано'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
