// src/pages/ProfilePage.tsx: Страница профиля пользователя, управления заведением, командой и резервным копированием

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeamPage } from './TeamPage';
import { Venue, Profile } from '../types';
import { dataService } from '../db/dataService';
import {
  User,
  Users,
  Building2,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  CheckCircle2
} from 'lucide-react';

interface ProfilePageProps {
  venues: Venue[];
  activeVenueId: string;
  onVenueChange: (venueId: string) => void;
  currentProfile: Profile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  venues,
  activeVenueId,
  onVenueChange,
  currentProfile,
  darkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'team' | 'database'>('team');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  const isOwner = currentProfile.role === 'owner';
  const activeVenue = venues.find(v => v.id === activeVenueId);

  const handleDownloadBackup = async () => {
    const jsonStr = await dataService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sklad_Nastoyki_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('Резервная копия успешно выгружена');
    setTimeout(() => setBackupSuccessMessage(null), 3000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await dataService.importBackup(content);
      if (success) {
        alert('База данных успешно восстановлена из резервной копии!');
        window.location.reload();
      } else {
        alert('Не удалось прочитать файл резервной копии. Проверьте формат JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetCatalog = () => {
    if (window.confirm('Обновить базу данных и загрузить полный актуальный каталог из 26 авторских рецептур настоек?')) {
      dataService.resetMockData();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-5 space-y-6">
      {/* Карточка профиля */}
      <div className="bg-white dark:bg-surface-dark-card rounded-2xl p-4 sm:p-5 shadow-card border border-stone-200/70 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-brand-primary/10 dark:bg-brand-amber/15 text-brand-primary dark:text-brand-amber flex items-center justify-center shrink-0 shadow-inner">
              <User size={30} className="sm:size-34" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {currentProfile.full_name || 'Сотрудник'}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-amber text-brand-primary-dark uppercase">
                  {currentProfile.role === 'owner' ? 'Владелец' : currentProfile.role === 'staff' ? 'Сотрудник' : 'Наблюдатель'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  <ShieldCheck size={12} className="inline mr-1" />
                  Авторизован
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Сеть ресторанов «Мордовское подворье» • Производство и склад
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={onToggleDarkMode}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Переключить тему оформления"
            >
              {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
              <span className="hidden xs:inline">{darkMode ? 'Светлая' : 'Тёмная'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Выйти из аккаунта"
            >
              <LogOut size={15} />
              <span className="hidden xs:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Выбор активного заведения */}
        <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Building2 size={16} className="text-brand-primary dark:text-brand-amber shrink-0" />
            <span>Активное заведение:</span>
            <span className="text-stone-900 dark:text-stone-100 font-bold">
              {activeVenue?.name || 'Не выбрано'}
            </span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
              {venues.map((v) => {
                const isActive = v.id === activeVenueId;
                return (
                  <button
                    key={v.id}
                    onClick={() => onVenueChange(v.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {v.name}
                    {v.kind === 'production' && ' (База)'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Вкладки раздела профиля: Команда / Управление БД */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users size={16} />
          <span>Команда и доступы</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'database'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Database size={16} />
          <span>База данных и бэкап</span>
        </button>
      </div>

      {backupSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{backupSuccessMessage}</span>
        </div>
      )}

      {/* Содержимое вкладки «Команда» */}
      {activeTab === 'team' && (
        <div className="-mt-3">
          <TeamPage venues={venues} currentProfile={currentProfile} />
        </div>
      )}

      {/* Содержимое вкладки «База данных и бэкап» */}
      {activeTab === 'database' && (
        <div className="bg-white dark:bg-surface-dark-card rounded-2xl p-4 sm:p-5 shadow-card border border-stone-200/70 dark:border-stone-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Database size={18} className="text-brand-primary dark:text-brand-amber" />
              Локальная база данных (IndexedDB + LocalStorage)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Все данные сохраняются локально на этом устройстве. Регулярно выгружайте резервную копию JSON для переноса на другие устройства.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleDownloadBackup}
              className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-amber/15 text-brand-primary dark:text-brand-amber flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Скачать бэкап
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Экспорт всех остатков и рецептов в JSON
                </span>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Восстановить базу
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Импорт сохраненного файла JSON
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </button>

            <button
              onClick={handleResetCatalog}
              className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Сбросить каталог
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Загрузить 26 авторских рецептур
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
