// src/pages/RecipesPage.tsx: Каталог рецептов, калькулятор расхода на N литров и пошаговое создание

import React, { useState, useEffect } from 'react';
import { dataService } from '../db/dataService';
import { Recipe, RecipeCategory, RecipeIngredient, InventoryItem, Venue, Profile, UnitType } from '../types';
import { BottomSheet } from '../components/common/BottomSheet';
import { calculateBatchRequirements } from '../domain/inventory/calculator';
import {
  BookOpen, Plus, Search, Sparkles, Clock, Percent, Droplets, CheckCircle, AlertTriangle, ArrowRight
} from 'lucide-react';

interface RecipesPageProps {
  activeVenueId: string;
  venues: Venue[];
  currentProfile: Profile;
  onNavigateToBatchCreate?: (recipeId: string, volumeLiters: number) => void;
}

export const RecipesPage: React.FC<RecipesPageProps> = ({
  activeVenueId,
  venues,
  currentProfile,
  onNavigateToBatchCreate
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stock, setStock] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Просмотр и калькулятор выбранного рецепта
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [calcVolumeLiters, setCalcVolumeLiters] = useState<number>(3);

  // Пошаговая форма добавления рецепта
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<number>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RecipeCategory>('ягодная');
  const [newIngredients, setNewIngredients] = useState<RecipeIngredient[]>([
    { name: 'Спирт люкс 96%', qty: 450, unit: 'мл' }
  ]);
  const [newDays, setNewDays] = useState(14);
  const [newAbv, setNewAbv] = useState(38);
  const [newYieldMl, setNewYieldMl] = useState(900);
  const [newLossPct, setNewLossPct] = useState(10);
  const [newSteps, setNewSteps] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const canEdit = currentProfile.role === 'owner' || currentProfile.role === 'staff';

  useEffect(() => {
    loadData();
  }, [activeVenueId]);

  const loadData = async () => {
    const [rList, sList] = await Promise.all([
      dataService.getRecipes(),
      dataService.getInventory(activeVenueId)
    ]);
    setRecipes(rList);
    setStock(sList);
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Все' },
    { id: 'ягодная', label: 'Ягодные' },
    { id: 'фруктовая', label: 'Фруктовые' },
    { id: 'пряная', label: 'Пряные' },
    { id: 'наливка', label: 'Наливки' },
    { id: 'другое', label: 'Другие' },
  ];

  const filteredRecipes = recipes.filter(r => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesQuery = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Расчет остатков сырья на складе
  const stockMap: Record<string, number> = {};
  for (const s of stock) {
    stockMap[s.name.toLowerCase()] = s.quantity;
  }

  // Расчет расхода для активного рецепта
  const reqs = activeRecipe
    ? calculateBatchRequirements(activeRecipe.ingredients, calcVolumeLiters, stockMap)
    : [];

  const handleAddIngredientRow = () => {
    setNewIngredients(prev => [...prev, { name: '', qty: 100, unit: 'г' }]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    setNewIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveRecipe = async () => {
    if (!newTitle.trim()) return;

    await dataService.addRecipe({
      title: newTitle.trim(),
      category: newCategory,
      ingredients: newIngredients.filter(i => i.name.trim().length > 0),
      base_volume_мл: 1000,
      days: newDays,
      target_abv: newAbv,
      yield_мл: newYieldMl,
      loss_pct: newLossPct,
      steps: newSteps,
      notes: newNotes,
      created_by: currentProfile.id
    });

    setIsAddOpen(false);
    setAddStep(1);
    setNewTitle('');
    loadData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Шапка и создание */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="text-brand-primary" />
            Технологические карты (Рецепты)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Все рецептуры рассчитаны на 1 литр базы с авто-масштабированием
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setAddStep(1);
              setIsAddOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Новый рецепт</span>
          </button>
        )}
      </div>

      {/* Поиск и категории */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Поиск рецепта по названию..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 touch-pan-x pr-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                selectedCategory === c.id
                  ? 'bg-stone-900 text-white dark:bg-brand-amber dark:text-brand-primary-dark shadow-sm'
                  : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список рецептов */}
      <div className="grid sm:grid-cols-2 gap-3.5">
        {filteredRecipes.map((r) => {
          // Проверяем, хватает ли ингредиентов хотя бы на 1 л
          const reqs1L = calculateBatchRequirements(r.ingredients, 1, stockMap);
          const hasAllIngredients = !reqs1L.some(i => i.willBe < 0);

          return (
            <div
              key={r.id}
              onClick={() => {
                setActiveRecipe(r);
                setCalcVolumeLiters(3);
              }}
              className="p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 cursor-pointer hover:border-brand-amber/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    {r.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500">
                    <Clock size={13} />
                    <span>{r.days} дн.</span>
                  </div>
                </div>

                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {r.title}
                </h4>

                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                  {r.notes || r.steps}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-center gap-1">
                    <Percent size={13} className="text-brand-amber" />
                    <span>Крепость: <strong>{r.target_abv}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets size={13} className="text-brand-primary" />
                    <span>Выход: <strong>{r.yield_мл} мл/л</strong></span>
                  </div>
                </div>
              </div>

              {/* Индикатор доступности сырья */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                {hasAllIngredients ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle size={14} /> Хватает сырья
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle size={14} /> Нехватка ингредиентов
                  </span>
                )}
                <span className="text-brand-primary dark:text-brand-amber font-bold flex items-center gap-0.5">
                  Открыть <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Шторка рецепта и калькулятор «на N литров» */}
      <BottomSheet
        isOpen={!!activeRecipe}
        onClose={() => setActiveRecipe(null)}
        title={activeRecipe?.title}
      >
        {activeRecipe && (
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300">
                  Калькулятор объёма партии:
                </span>
                <span className="text-base font-extrabold text-brand-primary dark:text-brand-amber">
                  {calcVolumeLiters} л
                </span>
              </div>

              {/* Ползунок объёма */}
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={calcVolumeLiters}
                onChange={e => setCalcVolumeLiters(parseFloat(e.target.value))}
                className="w-full accent-brand-primary"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                <span>0.5 л</span>
                <span>Расчетный выход: ~{Math.round(calcVolumeLiters * activeRecipe.yield_мл)} мл</span>
                <span>25 л</span>
              </div>
            </div>

            {/* Состав и Было -> Станет */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Расход сырья со склада заведения:
              </h4>

              <div className="space-y-1.5">
                {reqs.map((ing, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-stone-100/70 dark:bg-stone-800/60 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{ing.name}</div>
                      <div className="text-[11px] text-stone-500">
                        Нужно: <strong className="text-brand-primary">{ing.required} {ing.unit}</strong> • На складе: {ing.available} {ing.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold ${ing.willBe < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        Было {ing.available} → {ing.willBe} {ing.unit}
                      </div>
                      {ing.warning && (
                        <div className="text-[10px] text-rose-500 font-semibold">{ing.warning}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Технологические этапы */}
            {activeRecipe.steps && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Этапы приготовления:
                </h4>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed p-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                  {activeRecipe.steps}
                </p>
              </div>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  if (onNavigateToBatchCreate) {
                    onNavigateToBatchCreate(activeRecipe.id, calcVolumeLiters);
                  }
                  setActiveRecipe(null);
                }}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-xl shadow-md transition-all active:scale-98"
              >
                Поставить партию на {calcVolumeLiters} л
              </button>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Пошаговая форма добавления рецепта */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={`Новый рецепт (Шаг ${addStep} из 3)`}
      >
        <div className="space-y-4">
          {addStep === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Название настойки
                </label>
                <input
                  type="text"
                  required
                  placeholder="Настойка на бруснике с розмарином..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Категория
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as RecipeCategory)}
                  className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
                >
                  <option value="ягодная">Ягодная</option>
                  <option value="фруктовая">Фруктовая</option>
                  <option value="пряная">Пряная</option>
                  <option value="наливка">Наливка</option>
                  <option value="другое">Другое</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Дней настаивания
                  </label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={e => setNewDays(parseInt(e.target.value) || 10)}
                    className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Крепость %
                  </label>
                  <input
                    type="number"
                    value={newAbv}
                    onChange={e => setNewAbv(parseInt(e.target.value) || 38)}
                    className="w-full p-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <button
                disabled={!newTitle.trim()}
                onClick={() => setAddStep(2)}
                className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl mt-2 disabled:opacity-50"
              >
                Далее: Ингредиенты на 1 л →
              </button>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                  Состав на 1 литр базового объёма:
                </span>
                <button
                  onClick={handleAddIngredientRow}
                  className="text-xs text-brand-primary font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Добавить строку
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newIngredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ингредиент"
                      value={ing.name}
                      onChange={e => {
                        const val = e.target.value;
                        setNewIngredients(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                      }}
                      className="flex-2 p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Кол-во"
                      value={ing.qty}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setNewIngredients(prev => prev.map((item, i) => i === idx ? { ...item, qty: val } : item));
                      }}
                      className="w-20 p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg"
                    />
                    <select
                      value={ing.unit}
                      onChange={e => {
                        const val = e.target.value as UnitType;
                        setNewIngredients(prev => prev.map((item, i) => i === idx ? { ...item, unit: val } : item));
                      }}
                      className="w-16 p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg"
                    >
                      <option value="г">г</option>
                      <option value="мл">мл</option>
                      <option value="шт">шт</option>
                      <option value="кг">кг</option>
                      <option value="л">л</option>
                    </select>
                    {newIngredients.length > 1 && (
                      <button
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="text-stone-400 hover:text-rose-500 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAddStep(1)}
                  className="w-1/3 py-2.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setAddStep(3)}
                  className="flex-1 py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs"
                >
                  Далее: Шаги и сохранение →
                </button>
              </div>
            </div>
          )}

          {addStep === 3 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Шаги приготовления и фильтрации
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Размять ягоды... 2. Залить спиртом..."
                  value={newSteps}
                  onChange={e => setNewSteps(e.target.value)}
                  className="w-full p-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Заметки технолога
                </label>
                <textarea
                  rows={2}
                  placeholder="Особенности подачи, органолептика..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAddStep(2)}
                  className="w-1/3 py-2.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs"
                >
                  ← Назад
                </button>
                <button
                  onClick={handleSaveRecipe}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Сохранить техкарту
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
