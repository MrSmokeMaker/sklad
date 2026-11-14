// src/pages/AuthPage.tsx: Вход и принятие QR-приглашения

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/branding/LogoMark';
import { dataService } from '../db/dataService';
import { Invite, Profile } from '../types';
import { Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (profile: Profile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();

  const [isInviteMode, setIsInviteMode] = useState<boolean>(false);
  const [inviteData, setInviteData] = useState<Invite | null>(null);
  const [loadingInvite, setLoadingInvite] = useState<boolean>(false);

  // Форма входа
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Быстрый выбор демо-профиля
  const [demoProfiles, setDemoProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    dataService.getProfiles().then(setDemoProfiles);

    if (token) {
      setIsInviteMode(true);
      setLoadingInvite(true);
      dataService.getInviteByToken(token).then((inv) => {
        setLoadingInvite(false);
        if (inv) {
          setInviteData(inv);
        } else {
          setErrorMsg('Ссылка приглашения недействительна или срок её действия истек (7 дней).');
        }
      });
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isInviteMode && token) {
        // Регистрация по приглашению
        const profile = await dataService.acceptInvite(token, email, fullName || 'Сотрудник');
        onLoginSuccess(profile);
        navigate('/');
      } else {
        // Стандартный вход
        const existing = demoProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          dataService.setCurrentUserId(existing.id);
          onLoginSuccess(existing);
          navigate('/');
        } else {
          // Создание нового пользователя (первый = owner, иначе viewer)
          const newProf: Profile = {
            id: 'usr-' + Date.now(),
            email,
            full_name: fullName || email.split('@')[0],
            role: demoProfiles.length === 0 ? 'owner' : 'viewer',
            venue_id: 'production-podvorie'
          };
          dataService.setCurrentUserId(newProf.id);
          onLoginSuccess(newProf);
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка аутентификации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSwitch = (prof: Profile) => {
    dataService.setCurrentUserId(prof.id);
    onLoginSuccess(prof);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-surface-bg dark:bg-surface-dark-bg">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark-card rounded-2xl shadow-card p-6 sm:p-8 border border-stone-200/70 dark:border-stone-800">
        <div className="flex flex-col items-center text-center mb-6">
          <LogoMark mode="ambient" size={64} className="mb-3" />
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            {isInviteMode ? 'Приглашение в команду' : 'Вход в Настойки'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Сеть ресторанов «Мордовское подворье»
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isInviteMode && inviteData && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <ShieldCheck size={16} />
              <span>Роль по приглашению: {inviteData.role.toUpperCase()}</span>
            </div>
            <p>Заведение: {inviteData.venue_id || 'Все заведения'}. Задайте email и пароль для входа.</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {isInviteMode && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Ваше имя
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Иван Иванов"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Электронная почта
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-stone-400" />
              <input
                type="email"
                required
                placeholder="bartender@podvorie.ru"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Пароль
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (isInviteMode && !inviteData)}
            className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-light text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            {isInviteMode ? 'Активировать аккаунт' : 'Войти в систему'}
          </button>
        </form>

        {/* Быстрый демо-вход под тестовыми аккаунтами */}
        <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2 text-center">
            Быстрый вход для тестирования:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleQuickDemoSwitch(p)}
                className="p-2 text-left text-xs rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200/50 dark:border-stone-700"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200 truncate">{p.full_name}</div>
                <div className="text-[10px] text-brand-primary dark:text-brand-amber font-semibold uppercase">
                  {p.role} {p.venue_id ? `(${p.venue_id.replace('venue-', '').replace('production-', '')})` : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
