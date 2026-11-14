// src/pages/ShowcasePage.tsx: Гостевая витрина настоек сети «Мордовское подворье»

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../db/dataService';
import { ShowcaseItem } from '../types';
import { LogoMark } from '../components/branding/LogoMark';
import {
  Sparkles, Search, UtensilsCrossed, Clock, Percent, BookOpen, Plus, X, Bot, Check
} from 'lucide-react';

export const ShowcasePage: React.FC = () => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCreatedTitle, setLastCreatedTitle] = useState<string | null>(null);

  useEffect(() => {
    loadShowcase();
  }, []);

  const loadShowcase = async () => {
    setLoading(true);
    const data = await dataService.getShowcaseItems();
    setItems(data);
    setLoading(false);
  };

  const handleGenerateAiItem = async (customPrompt?: string) => {
    setIsGenerating(true);
    try {
      const prompt = customPrompt || aiPrompt || 'Создай авторскую настойку для витрины';
      const res = await dataService.callAiAssistant(prompt);
      if (res.intent && res.intent.action === 'showcase_create' && res.intent.showcase_item) {
        await dataService.addShowcaseItem(res.intent.showcase_item);
        setLastCreatedTitle(res.intent.showcase_item.title);
        await loadShowcase();
        setTimeout(() => {
          setIsAiModalOpen(false);
          setAiPrompt('');
          setLastCreatedTitle(null);
        }, 1200);
      }
    } catch (err: any) {
      alert(`Ошибка генерации: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Все настойки' },
    { id: 'ягодная', label: 'Ягодные' },
    { id: 'цитрусовая', label: 'Цитрусовые' },
    { id: 'фруктовая', label: 'Фруктовые' },
    { id: 'пряная', label: 'Пряные' },
    { id: 'гастрономическая', label: 'Гастрономические' },
    { id: 'десертная', label: 'Десертные' },
  ];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.title_en.toLowerCase().includes(query) ||
      item.flavor_profile.descriptors.some(d => d.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  const renderDots = (value: number) => {
    return (
      <span className="font-mono text-xs tracking-wider text-brand-primary dark:text-brand-amber shrink-0 select-none">
        {'●'.repeat(value)}
        <span className="text-stone-300 dark:text-stone-700">{'○'.repeat(5 - value)}</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-4 py-5 sm:py-6 space-y-5 overflow-hidden">
      {/* Заголовок витрины и кнопка ИИ */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center p-2 rounded-full bg-brand-primary/10 mb-1">
          <LogoMark mode="ambient" size={48} />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          Витрина авторских настоек
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Коллекция дистиллятов и мацератов ручной работы сети ресторанов «Мордовское подворье». Подаются исключительно ледяными.
        </p>

        <div className="pt-1">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light hover:from-brand-primary-dark hover:to-brand-primary text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Sparkles size={14} className="text-brand-amber" />
            <span>Добавить новую настойку через ИИ</span>
          </button>
        </div>
      </div>

      {/* Поиск и категории */}
      <div className="space-y-3 w-full min-w-0">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Поиск по названию или нотам вкуса (ежевика, корица, хрен...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="w-full min-w-0 max-w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 touch-pan-x pr-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-primary text-white shadow-sm scale-102'
                  : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Сетка карточек витрины */}
      <div className="grid md:grid-cols-2 gap-4 w-full min-w-0">
        {filteredItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(0.25, idx * 0.04) }}
            className="p-4 sm:p-5 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/70 dark:border-stone-800 flex flex-col justify-between space-y-4 hover:border-brand-amber/70 transition-colors w-full min-w-0 max-w-full overflow-hidden"
          >
            <div>
              {/* Шапка карточки */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl select-none" role="img" aria-label={item.title}>
                    {item.emoji}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 leading-tight">
                      {item.title}
                    </h3>
                    <div className="text-[11px] text-stone-400 font-medium tracking-tight">
                      {item.title_en}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase tracking-wider shrink-0">
                  {item.category}
                </span>
              </div>

              {/* Бейджи характеристик */}
              <div className="flex flex-wrap items-center gap-2 my-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center gap-1 shrink-0">
                  <Percent size={13} className="text-brand-amber" />
                  Крепость: {item.abv}%
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center gap-1 shrink-0">
                  <Clock size={13} className="text-brand-primary" />
                  Выдержка: {item.aging_text}
                </span>
              </div>

              {/* Вкусовой профиль */}
              <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl space-y-1.5 my-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Вкусовая матрица:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-stone-400">Сладость:</span>
                    {renderDots(item.flavor_profile.sweetness)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-stone-400">Кислинка:</span>
                    {renderDots(item.flavor_profile.acidity)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-stone-400">Пряность / Острота:</span>
                    {renderDots(item.flavor_profile.spice)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 dark:text-stone-400">Плотность тела:</span>
                    {renderDots(item.flavor_profile.density)}
                  </div>
                </div>

                {/* Дескрипторы */}
                <div className="flex flex-wrap gap-1 pt-1.5 border-t border-stone-200/60 dark:border-stone-800">
                  {item.flavor_profile.descriptors.map((d, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700"
                    >
                      #{d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Сторителлинг и легенда */}
              <div className="p-3.5 bg-brand-cream-surface/70 dark:bg-stone-900/30 rounded-xl border border-amber-200/50 dark:border-stone-800">
                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-primary dark:text-brand-amber uppercase tracking-wider mb-1">
                  <BookOpen size={12} />
                  <span>Легенда и букет:</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                  «{item.storytelling}»
                </p>
              </div>
            </div>

            {/* Фудпейринг */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 text-xs">
              <UtensilsCrossed size={14} className="text-brand-amber shrink-0" />
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Идеальная пара:
              </span>
              <span className="text-stone-500 text-[11px] truncate">
                {item.food_pairing}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Модальное окно генерации настойки через ИИ */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary dark:text-brand-amber">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                      ИИ-генератор настоек
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Автономный шеф-технолог сгенерирует легенду, крепость 28-32% и вкусовую матрицу
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isGenerating && setIsAiModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X size={18} />
                </button>
              </div>

              {lastCreatedTitle ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-1">
                  <div className="inline-flex p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 mb-1">
                    <Check size={20} />
                  </div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Успешно добавлено на витрину!
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    «{lastCreatedTitle}»
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Пожелание или ингредиент (необязательно):
                    </label>
                    <input
                      type="text"
                      placeholder="Например: на бруснике с можжевельником или груша с ванилью"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Быстрые варианты */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Быстрые идеи:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {['Брусничная с можжевельником', 'Томленая груша', 'Красный грейпфрут', 'Мордовская перцовка'].map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => handleGenerateAiItem(idea)}
                          disabled={isGenerating}
                          className="text-[10px] px-2 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg transition-colors font-medium"
                        >
                          + {idea}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(false)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiItem()}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Генерирую...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Сгенерировать</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
