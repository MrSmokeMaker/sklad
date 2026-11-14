// src/pages/BatchesPage.tsx: Список партий на таймлайне, залив партии, списание и дегустационные оценки

import React, { useState, useEffect } from 'react';
import { dataService } from '../db/dataService';
import { Batch, Recipe, Infusion, Venue, Profile, BatchStatus } from '../types';
import { BottomSheet } from '../components/common/BottomSheet';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { calculateBatchRequirements } from '../domain/inventory/calculator';
import {
  Wine, Plus, Calendar, Clock, Star, ArrowRightLeft, Camera, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface BatchesPageProps {
  activeVenueId: string;
  venues: Venue[];
  currentProfile: Profile;
}

export const BatchesPage: React.FC<BatchesPageProps> = ({
  activeVenueId,
  venues,
  currentProfile
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [loading, setLoading] = useState(true);

  // Сегмент-контрол статусов: все / настаивается / готово / разлито
  const [statusFilter, setStatusFilter] = useState<'all' | 'настаивается' | 'готово' | 'разлито'>('all');

  // Шторка нового залива
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [targetVolumeLiters, setTargetVolumeLiters] = useState<number>(3);
  const [targetAbv, setTargetAbv] = useState<number>(38);
  const [batchPhoto, setBatchPhoto] = useState<string | null>(null);
  const [createWarnings, setCreateWarnings] = useState<string[]>([]);

  // Шторка дегустации и оценки (1-5 звезд)
  const [ratingBatch, setRatingBatch] = useState<Batch | null>(null);
  const [newRating, setNewRating] = useState<number>(5);
  const [tastingNotes, setTastingNotes] = useState('');

  const canEdit = currentProfile.role === 'owner' || (currentProfile.role === 'staff' && currentProfile.venue_id === activeVenueId);

  useEffect(() => {
    loadData();
  }, [activeVenueId]);

  const loadData = async () => {
    setLoading(true);
    const [bList, rList, iList] = await Promise.all([
      dataService.getBatches(activeVenueId),
      dataService.getRecipes(),
      dataService.getInfusions()
    ]);
    setBatches(bList);
    setRecipes(rList);
    setInfusions(iList);
    if (rList.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(rList[0].id);
      setTargetAbv(rList[0].target_abv);
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBatchPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) return;

    const res = await dataService.createBatch(
      selectedRecipeId,
      activeVenueId,
      targetVolumeLiters,
      targetAbv,
      batchPhoto
    );

    if (res.warnings.length > 0) {
      setCreateWarnings(res.warnings);
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateWarnings([]);
        setBatchPhoto(null);
        loadData();
      }, 2500);
    } else {
      setIsCreateOpen(false);
      setBatchPhoto(null);
      loadData();
    }
  };

  const handleSaveRating = async () => {
    if (!ratingBatch) return;

    await dataService.updateBatchStatus(
      ratingBatch.id,
      'разлито',
      newRating,
      tastingNotes
    );

    setRatingBatch(null);
    setTastingNotes('');
    loadData();
  };

  const getInfusionName = (infId: string) => infusions.find(i => i.id === infId)?.name || 'Настойка';

  // Расчет прогресса созревания для партии
  const getBatchProgress = (batch: Batch) => {
    if (batch.status === 'готово' || batch.status === 'разлито' || batch.status === 'архив') {
      return 100;
    }
    const start = new Date(batch.start_date).getTime();
    const end = new Date(batch.ready_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    const progress = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
    return progress;
  };

  const filteredBatches = batches.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Шапка и кнопка залива */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Wine className="text-brand-primary" />
            Партии настоек
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Таймлайн настаивания, дегустации и готовый запас • {venues.find(v => v.id === activeVenueId)?.name}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Залить партию</span>
          </button>
        )}
      </div>

      {/* Сегмент-контрол фильтрации статусов */}
      <SegmentedControl
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: 'all', label: 'Все партии', badge: batches.length },
          { value: 'настаивается', label: 'Настаивается', badge: batches.filter(b => b.status === 'настаивается').length },
          { value: 'готово', label: 'Готово', badge: batches.filter(b => b.status === 'готово').length },
          { value: 'разлито', label: 'Разлито/Оценено' },
        ]}
      />

      {/* Список партий на таймлайне */}
      <div className="space-y-3.5">
        {filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-surface-dark-card rounded-2xl border border-stone-200/60 dark:border-stone-800">
            Партий с выбранным статусом не найдено.
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const progress = getBatchProgress(batch);
            const isReady = progress >= 100 || batch.status === 'готово';

            return (
              <div
                key={batch.id}
                className="p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {batch.photo_url ? (
                      <img src={batch.photo_url} alt="Партия" className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                        <Wine size={22} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {getInfusionName(batch.infusion_id)}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          batch.status === 'готово'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : batch.status === 'настаивается'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}>
                          {batch.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 mt-0.5">
                        Объём: <strong>{batch.volume_мл} мл</strong> • Крепость: <strong>{batch.abv}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Оценка, если есть */}
                  {batch.rating ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg text-xs font-bold">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{batch.rating}/5</span>
                    </div>
                  ) : canEdit && batch.status === 'готово' ? (
                    <button
                      onClick={() => {
                        setRatingBatch(batch);
                        setNewRating(5);
                        setTastingNotes(batch.notes || '');
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                    >
                      Оценить / Разлить
                    </button>
                  ) : null}
                </div>

                {/* Прогресс-бар созревания на таймлайне */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Залив: {batch.start_date}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-stone-700 dark:text-stone-300">
                      <Clock size={12} /> Готовность: {batch.ready_date} ({progress}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isReady ? 'bg-emerald-500' : 'bg-brand-amber'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {batch.notes && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 italic pt-1 border-t border-stone-100 dark:border-stone-800">
                    «{batch.notes}»
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Шторка залива партии */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateWarnings([]);
        }}
        title="Залив новой партии настойки"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Рецепт (база рассчитана на 1 л)
            </label>
            <select
              value={selectedRecipeId}
              onChange={e => {
                setSelectedRecipeId(e.target.value);
                const r = recipes.find(rcp => rcp.id === e.target.value);
                if (r) setTargetAbv(r.target_abv);
              }}
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.title} ({r.category}, {r.days} дн.)</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Объём залива (литров):
              </span>
              <span className="text-base font-extrabold text-brand-primary dark:text-brand-amber">
                {targetVolumeLiters} л
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="30"
              step="0.5"
              value={targetVolumeLiters}
              onChange={e => setTargetVolumeLiters(parseFloat(e.target.value))}
              className="w-full accent-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Целевая крепость %
            </label>
            <input
              type="number"
              value={targetAbv}
              onChange={e => setTargetAbv(parseInt(e.target.value) || 38)}
              className="w-full p-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Фотография залива (необязательно)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300">
                <Camera size={16} />
                <span>Прикрепить фото</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {batchPhoto && (
                <img src={batchPhoto} alt="Превью" className="w-10 h-10 rounded-lg object-cover border" />
              )}
            </div>
          </div>

          {createWarnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-700">
                <AlertTriangle size={15} />
                <span>Предупреждения по остаткам сырья:</span>
              </div>
              {createWarnings.map((w, i) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all active:scale-98"
          >
            Списать сырьё со склада и поставить партию
          </button>
        </form>
      </BottomSheet>

      {/* Шторка оценки и дегустации */}
      <BottomSheet
        isOpen={!!ratingBatch}
        onClose={() => setRatingBatch(null)}
        title="Дегустационная оценка партии"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500">
            Партия: <strong>{ratingBatch ? getInfusionName(ratingBatch.infusion_id) : ''}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Оценка качества (1–5 звезд)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="p-1 text-2xl transition-transform active:scale-125"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= newRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-stone-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Заметки дегустации (аромат, вкус, замечания для AI-помощника)
            </label>
            <textarea
              rows={3}
              placeholder="Например: Отличный баланс, мягкая кислинка, сладость в норме..."
              value={tastingNotes}
              onChange={e => setTastingNotes(e.target.value)}
              className="w-full p-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
            />
          </div>

          <button
            onClick={handleSaveRating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98"
          >
            Сохранить оценку и статус «Разлито»
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
