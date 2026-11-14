// src/pages/InventoryPage.tsx: Страница «Склад» сырья и материалов

import React, { useState, useEffect } from 'react';
import { dataService } from '../db/dataService';
import { InventoryItem, Venue, Profile, UnitType } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { BottomSheet } from '../components/common/BottomSheet';
import { SegmentedControl } from '../components/common/SegmentedControl';
import {
  Boxes, Plus, Minus, Search, ArrowRightLeft, AlertTriangle, Calendar, Filter
} from 'lucide-react';

interface InventoryPageProps {
  activeVenueId: string;
  venues: Venue[];
  currentProfile: Profile;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  activeVenueId,
  venues,
  currentProfile
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Шторка быстрой корректировки +/-
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('1');

  // Шторка добавления сырья
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('ягоды');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState<UnitType>('кг');
  const [newMinStock, setNewMinStock] = useState('2');
  const [newExpiry, setNewExpiry] = useState('');

  // Шторка перемещения сырья
  const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferTargetVenue, setTransferTargetVenue] = useState<string>('');
  const [transferQty, setTransferQty] = useState<string>('');
  const [transferWarning, setTransferWarning] = useState<string | null>(null);

  const canEdit = currentProfile.role === 'owner' || (currentProfile.role === 'staff' && currentProfile.venue_id === activeVenueId);

  useEffect(() => {
    loadInventory();
  }, [activeVenueId]);

  const loadInventory = async () => {
    setLoading(true);
    const data = await dataService.getInventory(activeVenueId);
    setItems(data);
    setLoading(false);
  };

  const handleAdjustStock = async (deltaSign: 1 | -1) => {
    if (!adjustItem) return;
    const delta = parseFloat(adjustAmount) * deltaSign;
    if (isNaN(delta) || delta === 0) return;

    await dataService.updateInventoryStock(adjustItem.id, delta);
    setAdjustItem(null);
    loadInventory();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newQty) return;

    await dataService.addInventoryItem({
      name: newName.trim(),
      type: newType.trim(),
      venue_id: activeVenueId,
      quantity: parseFloat(newQty) || 0,
      unit: newUnit,
      min_stock: parseFloat(newMinStock) || 0,
      expiry_date: newExpiry || null
    });

    setIsAddSheetOpen(false);
    setNewName('');
    setNewQty('');
    loadInventory();
  };

  const handleTransferRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem || !transferTargetVenue || !transferQty) return;

    const qty = parseFloat(transferQty);
    if (isNaN(qty) || qty <= 0) return;

    if (qty > transferItem.quantity) {
      setTransferWarning(`Внимание: списание превышает остаток (${transferItem.quantity} ${transferItem.unit}). Остаток уйдет в минус.`);
    }

    await dataService.transferRaw(
      activeVenueId,
      transferTargetVenue,
      transferItem.name,
      qty,
      transferItem.unit
    );

    setIsTransferSheetOpen(false);
    setTransferItem(null);
    setTransferQty('');
    setTransferWarning(null);
    loadInventory();
  };

  // Фильтрация
  const typesList = ['all', ...Array.from(new Set(items.map(i => i.type)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const lowStockCount = items.filter(i => i.quantity < i.min_stock).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Шапка и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Boxes className="text-brand-primary" />
            Склад сырья
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Остатки ингредиентов заведения • {venues.find(v => v.id === activeVenueId)?.name}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddSheetOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Добавить сырьё</span>
          </button>
        )}
      </div>

      {/* Индикатор позиций с низким остатком */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>Внимание: {lowStockCount} поз. ниже минимального остатка! Требуется пополнение.</span>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Поиск по названию сырья (спирт, вишня, хрен...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        {typesList.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 touch-pan-x pr-2">
            {typesList.map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                  selectedType === t
                    ? 'bg-stone-900 text-white dark:bg-brand-amber dark:text-brand-primary-dark shadow-sm'
                    : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {t === 'all' ? 'Все типы' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Карточки сырья */}
      <div className="grid sm:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const isLow = item.quantity < item.min_stock;
          return (
            <div
              key={item.id}
              className={`p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border transition-all ${
                isLow ? 'border-rose-300 dark:border-rose-900/60' : 'border-stone-200/60 dark:border-stone-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                    {item.type}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                    {item.name}
                  </h4>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTransferItem(item);
                        setTransferTargetVenue(venues.find(v => v.id !== activeVenueId)?.id || '');
                        setIsTransferSheetOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300"
                      title="Переместить в заведение"
                    >
                      <ArrowRightLeft size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setAdjustItem(item);
                        setAdjustAmount('1');
                      }}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-brand-primary dark:text-brand-amber font-bold"
                      title="Скорректировать остаток"
                    >
                      ±
                    </button>
                  </div>
                )}
              </div>

              {/* Прогресс-бар остатка */}
              <ProgressBar
                current={item.quantity}
                minStock={item.min_stock}
                unit={item.unit}
                className="mt-2"
              />

              {item.expiry_date && (
                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-1 text-[11px] text-stone-500">
                  <Calendar size={13} />
                  <span>Срок годности: {item.expiry_date}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Шторка быстрой корректировки остатка (+ / -) */}
      <BottomSheet
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={`Корректировка: ${adjustItem?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500">
            Текущий остаток: <strong>{adjustItem?.quantity} {adjustItem?.unit}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Количество ({adjustItem?.unit})
            </label>
            <input
              type="number"
              step="any"
              value={adjustAmount}
              onChange={e => setAdjustAmount(e.target.value)}
              className="w-full p-2.5 text-base font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleAdjustStock(-1)}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Minus size={18} />
              <span>Списать</span>
            </button>
            <button
              onClick={() => handleAdjustStock(1)}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Plus size={18} />
              <span>Оприходовать</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Шторка перемещения сырья в заведение */}
      <BottomSheet
        isOpen={isTransferSheetOpen}
        onClose={() => {
          setIsTransferSheetOpen(false);
          setTransferWarning(null);
        }}
        title={`Перемещение: ${transferItem?.name}`}
      >
        <form onSubmit={handleTransferRaw} className="space-y-4">
          <p className="text-xs text-stone-500">
            Отправитель: <strong>{venues.find(v => v.id === activeVenueId)?.name}</strong> (остаток: {transferItem?.quantity} {transferItem?.unit})
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Заведение-получатель
            </label>
            <select
              value={transferTargetVenue}
              onChange={e => setTransferTargetVenue(e.target.value)}
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            >
              {venues.filter(v => v.id !== activeVenueId).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Количество к отправке ({transferItem?.unit})
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={transferQty}
              onChange={e => setTransferQty(e.target.value)}
              className="w-full p-2.5 text-base font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            />
          </div>

          {transferWarning && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-1.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>{transferWarning}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all mt-2 active:scale-98"
          >
            Отправить в 1 действие
          </button>
        </form>
      </BottomSheet>

      {/* Шторка добавления сырья */}
      <BottomSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        title="Добавить позицию на склад"
      >
        <form onSubmit={handleAddItem} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Название сырья
            </label>
            <input
              type="text"
              required
              placeholder="Смородина черная, Спирт 96%..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Тип (свободный ввод)
              </label>
              <input
                type="text"
                placeholder="ягоды, спирт, специи..."
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Ед. измерения
              </label>
              <select
                value={newUnit}
                onChange={e => setNewUnit(e.target.value as UnitType)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              >
                <option value="кг">кг</option>
                <option value="г">г</option>
                <option value="л">л</option>
                <option value="мл">мл</option>
                <option value="шт">шт</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Количество
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="10"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Мин. остаток
              </label>
              <input
                type="number"
                step="any"
                placeholder="2"
                value={newMinStock}
                onChange={e => setNewMinStock(e.target.value)}
                className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Срок годности (необязательно)
            </label>
            <input
              type="date"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all mt-2 active:scale-98"
          >
            Сохранить сырьё
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
