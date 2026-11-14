// src/pages/TeamPage.tsx: Управление командой и генерация QR-приглашений (Owner only)

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '../db/dataService';
import { Profile, Invite, Venue, UserRole } from '../types';
import { BottomSheet } from '../components/common/BottomSheet';
import { Users, QrCode, Copy, Trash2, Check, ShieldCheck, UserPlus, Clock } from 'lucide-react';

interface TeamPageProps {
  venues: Venue[];
  currentProfile: Profile;
}

export const TeamPage: React.FC<TeamPageProps> = ({ venues, currentProfile }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Состояние создания приглашения
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [newInviteRole, setNewInviteRole] = useState<UserRole>('staff');
  const [newInviteVenue, setNewInviteVenue] = useState<string>('venue-samovar');
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pList, iList] = await Promise.all([
      dataService.getProfiles(),
      dataService.getInvites()
    ]);
    setProfiles(pList);
    setInvites(iList);
    setLoading(false);
  };

  const handleCreateInvite = async () => {
    const inv = await dataService.createInvite(newInviteRole, newInviteVenue);
    setCreatedInvite(inv);
    loadData();
  };

  const handleRevokeInvite = async (id: string) => {
    await dataService.revokeInvite(id);
    if (createdInvite?.id === id) setCreatedInvite(null);
    loadData();
  };

  const handleRoleChange = async (profileId: string, role: UserRole, venueId: string | null) => {
    await dataService.updateProfileRole(profileId, role, venueId);
    loadData();
  };

  const getInviteUrl = (token: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#/invite/${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Шапка раздела */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="text-brand-primary" />
            Команда и доступы
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Управление персоналом сети «Мордовское подворье»
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedInvite(null);
            setIsInviteSheetOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <UserPlus size={16} />
          <span>Пригласить</span>
        </button>
      </div>

      {/* Список участников */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Сотрудники сети ({profiles.length})
        </h3>

        <div className="grid gap-2.5">
          {profiles.map((p) => {
            const venueName = venues.find(v => v.id === p.venue_id)?.name || 'Все заведения';
            const isSelf = p.id === currentProfile.id;

            return (
              <div
                key={p.id}
                className="p-3.5 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {p.full_name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Вы
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {p.email} • <span className="font-medium text-stone-700 dark:text-stone-300">{venueName}</span>
                  </div>
                </div>

                {/* Селектор роли */}
                {!isSelf ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole, p.venue_id)}
                      className="text-xs font-semibold px-2 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                    >
                      <option value="staff">Staff (Бармен/Склад)</option>
                      <option value="owner">Owner (Шеф/Владелец)</option>
                      <option value="viewer">Viewer (Руководство/Аудит)</option>
                    </select>

                    <select
                      value={p.venue_id || ''}
                      onChange={(e) => handleRoleChange(p.id, p.role, e.target.value || null)}
                      className="text-xs font-semibold px-2 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                    >
                      <option value="">Все заведения</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs font-bold uppercase text-brand-primary dark:text-brand-amber">
                    {p.role}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Активные приглашения */}
      {invites.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} />
            Ожидающие приглашения ({invites.length})
          </h3>

          <div className="grid gap-2">
            {invites.map((inv) => {
              const url = getInviteUrl(inv.token);
              const venueName = venues.find(v => v.id === inv.venue_id)?.name || 'Все заведения';

              return (
                <div
                  key={inv.id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-800 dark:text-stone-200">
                      Приглашение: {inv.role.toUpperCase()} ({venueName})
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Действует до: {new Date(inv.expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(url)}
                      className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 text-stone-700 dark:text-stone-300"
                      title="Копировать ссылку"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-rose-600"
                      title="Отозвать приглашение"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Нижняя шторка генерации QR-приглашения */}
      <BottomSheet
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
        title="Создать приглашение по QR"
      >
        {!createdInvite ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Роль сотрудника
              </label>
              <select
                value={newInviteRole}
                onChange={(e) => setNewInviteRole(e.target.value as UserRole)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              >
                <option value="staff">Staff — Операционный учет, залив партий и перемещения</option>
                <option value="viewer">Viewer — Только просмотр отчетов и статистики</option>
                <option value="owner">Owner — Полный доступ и управление сетью</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Привязанное заведение
              </label>
              <select
                value={newInviteVenue}
                onChange={(e) => setNewInviteVenue(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.kind === 'production' ? 'Производство' : 'Бар'})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateInvite}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all mt-2"
            >
              Сгенерировать QR-код
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-stone-200">
              <QRCodeSVG
                value={getInviteUrl(createdInvite.token)}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Приглашение готово (роль: {createdInvite.role})
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Покажите QR-код сотруднику или отправьте одноразовую ссылку. Срок жизни — 7 дней.
              </p>
            </div>

            <div className="w-full flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getInviteUrl(createdInvite.token)}
                className="flex-1 p-2 text-xs bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 select-all"
              />
              <button
                onClick={() => copyToClipboard(getInviteUrl(createdInvite.token))}
                className="px-3 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
