// src/pages/TransfersPage.tsx: Журнал перемещений и откат выбранных операций

import React, { useState, useEffect } from 'react';
import { dataService } from '../db/dataService';
import { Transfer, OperationsLog, Venue, Profile, Infusion } from '../types';
import { BottomSheet } from '../components/common/BottomSheet';
import {
  ArrowLeftRight, RotateCcw, Filter, Calendar, Camera, CheckCircle2, ArrowRight, Building
} from 'lucide-react';

interface TransfersPageProps {
  venues: Venue[];
  currentProfile: Profile;
}

export const TransfersPage: React.FC<TransfersPageProps> = ({ venues, currentProfile }) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [operations, setOperations] = useState<OperationsLog[]>([]);
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'raw' | 'infusion'>('all');

  // Модалка отката операции
  const [selectedOpToRollback, setSelectedOpToRollback] = useState<OperationsLog | null>(null);
  const [isRollbackSuccess, setIsRollbackSuccess] = useState(false);

  // Форма нового быстрого перемещения настойки
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [fromVenue, setFromVenue] = useState('production-podvorie');
  const [toVenue, setToVenue] = useState('venue-samovar');
  const [selectedInfusionId, setSelectedInfusionId] = useState('');
  const [volumeMl, setVolumeMl] = useState('1000');
  const [portionsQty, setPortionsQty] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tList, opList, infList] = await Promise.all([
      dataService.getTransfers(),
      dataService.getOperationsLog(),
      dataService.getInfusions()
    ]);
    setTransfers(tList);
    setOperations(opList);
    setInfusions(infList);
    if (infList.length > 0 && !selectedInfusionId) {
      setSelectedInfusionId(infList[0].id);
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateInfusionTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfusionId || !fromVenue || !toVenue) return;

    let finalVolumeMl = parseFloat(volumeMl) || 0;
    if (portionsQty) {
      finalVolumeMl = parseFloat(portionsQty) * 40; // 1 порция = 40 мл
    }

    if (finalVolumeMl <= 0) return;

    await dataService.transferInfusion(
      fromVenue,
      toVenue,
      selectedInfusionId,
      finalVolumeMl,
      photoPreview
    );

    setIsCreateSheetOpen(false);
    setVolumeMl('1000');
    setPortionsQty('');
    setPhotoPreview(null);
    loadData();
  };

  const handleConfirmRollback = async () => {
    if (!selectedOpToRollback) return;
    await dataService.rollbackOperation(selectedOpToRollback.id);
    setIsRollbackSuccess(true);
    setTimeout(() => {
      setIsRollbackSuccess(false);
      setSelectedOpToRollback(null);
      loadData();
    }, 1200);
  };

  const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || id;
  const getInfusionName = (id?: string | null) => infusions.find(i => i.id === id)?.name || 'Настойка';

  // Фильтрация перемещений
  const filteredTransfers = transfers.filter(t => {
    const matchesVenue = venueFilter === 'all' || t.from_venue_id === venueFilter || t.to_venue_id === venueFilter;
    const matchesType = typeFilter === 'all' || t.item_type === typeFilter;
    return matchesVenue && matchesType;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Шапка и создание */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ArrowLeftRight className="text-brand-primary" />
            Перемещения между заведениями
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Операционный учёт • запись в 1 действие без подтверждения приёма
          </p>
        </div>

        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
        >
          <ArrowLeftRight size={16} />
          <span>Отправить настойку</span>
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={venueFilter}
          onChange={e => setVenueFilter(e.target.value)}
          className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none"
        >
          <option value="all">Все заведения</option>
          {venues.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none"
        >
          <option value="all">Все типы</option>
          <option value="infusion">Только настойки</option>
          <option value="raw">Только сырьё</option>
        </select>
      </div>

      {/* Список перемещений */}
      <div className="space-y-3">
        {filteredTransfers.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-surface-dark-card rounded-2xl border border-stone-200/60 dark:border-stone-800">
            Перемещений за выбранный период не найдено.
          </div>
        ) : (
          filteredTransfers.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                {t.photo_url ? (
                  <img src={t.photo_url} alt="Фото" className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold text-xs">
                    {t.item_type === 'infusion' ? 'Настойка' : 'Сырьё'}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {t.item_type === 'infusion' ? getInfusionName(t.infusion_id) : 'Партия сырья'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {t.qty} {t.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{getVenueName(t.from_venue_id)}</span>
                    <ArrowRight size={13} className="text-stone-400" />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{getVenueName(t.to_venue_id)}</span>
                  </div>

                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {new Date(t.transfer_date).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Журнал операций и возможность отката */}
      <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <RotateCcw size={14} />
          Журнал операций (доступен откат выбранных действий)
        </h3>

        <div className="grid gap-2">
          {operations.slice(0, 10).map((op) => (
            <div
              key={op.id}
              className="p-3 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  {op.object}
                </div>
                <div className="text-[11px] text-stone-500">
                  {new Date(op.created_at).toLocaleString('ru-RU')} • {op.details}
                </div>
              </div>

              {(currentProfile.role === 'owner' || currentProfile.role === 'staff') && (
                <button
                  onClick={() => setSelectedOpToRollback(op)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Откатить</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Шторка подтверждения отката */}
      <BottomSheet
        isOpen={!!selectedOpToRollback}
        onClose={() => setSelectedOpToRollback(null)}
        title="Откат выбранной операции"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Вы собираетесь отменить операцию: <strong>«{selectedOpToRollback?.object}»</strong>.
            Списанные и начисленные остатки на складах обоих заведений будут автоматически возвращены в исходное состояние.
          </p>

          {isRollbackSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Операция успешно отменена, остатки восстановлены!</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedOpToRollback(null)}
                className="py-2.5 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmRollback}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Подтвердить откат
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Шторка отправки настойки в 1 действие */}
      <BottomSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        title="Отправить настойку в заведение"
      >
        <form onSubmit={handleCreateInfusionTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Настойка
            </label>
            <select
              value={selectedInfusionId}
              onChange={e => setSelectedInfusionId(e.target.value)}
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            >
              {infusions.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Откуда
              </label>
              <select
                value={fromVenue}
                onChange={e => setFromVenue(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Куда (получатель)
              </label>
              <select
                value={toVenue}
                onChange={e => setToVenue(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              >
                {venues.filter(v => v.id !== fromVenue).map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Объём в мл
              </label>
              <input
                type="number"
                step="50"
                value={volumeMl}
                onChange={e => {
                  setVolumeMl(e.target.value);
                  setPortionsQty('');
                }}
                className="w-full p-2.5 text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Либо в порциях (по 40 мл)
              </label>
              <input
                type="number"
                placeholder="25 порций"
                value={portionsQty}
                onChange={e => {
                  setPortionsQty(e.target.value);
                  if (e.target.value) {
                    setVolumeMl(String(parseFloat(e.target.value) * 40));
                  }
                }}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Прикрепление фото */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Фотография партии / накладной (необязательно)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300">
                <Camera size={16} />
                <span>Загрузить фото</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <img src={photoPreview} alt="Превью" className="w-10 h-10 rounded-lg object-cover border" />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all mt-2 active:scale-98"
          >
            Списать по FIFO и зачислить в 1 действие
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
