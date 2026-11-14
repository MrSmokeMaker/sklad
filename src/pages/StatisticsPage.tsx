// src/pages/StatisticsPage.tsx: Финансовая аналитика, импорт отчетов Excel, графики и PDF-экспорт

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { dataService } from '../db/dataService';
import { parseExcelReport, ParseResult } from '../domain/excel/excelParser';
import { Sale, Venue, Profile, Infusion, InfusionSet, NameMapping } from '../types';
import { BottomSheet } from '../components/common/BottomSheet';
import {
  BarChart3, Upload, FileSpreadsheet, Download, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Filter
} from 'lucide-react';

interface StatisticsPageProps {
  venues: Venue[];
  currentProfile: Profile;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ venues, currentProfile }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [sets, setSets] = useState<InfusionSet[]>([]);
  const [nameMappings, setNameMappings] = useState<NameMapping[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры отчета
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-11-01');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  // Результаты импорта Excel
  const [importSummary, setImportSummary] = useState<ParseResult | null>(null);
  const [unmappedToResolve, setUnmappedToResolve] = useState<ParseResult['unmappedPositions']>([]);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Сгенерированный AI-отчет
  const [aiReportText, setAiReportText] = useState<string | null>(null);
  const [generatingAiReport, setGeneratingAiReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sList, iList, setList, mList] = await Promise.all([
      dataService.getSales(),
      dataService.getInfusions(),
      dataService.getSets(),
      dataService.getNameMappings()
    ]);
    setSales(sList);
    setInfusions(iList);
    setSets(setList);
    setNameMappings(mList);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const parseResult = parseExcelReport(
        buffer,
        sales,
        nameMappings,
        infusions,
        sets
      );

      // Немедленная вставка валидных позиций в базу sales
      if (parseResult.itemsToInsert.length > 0) {
        await dataService.insertSales(parseResult.itemsToInsert);
      }

      setImportSummary(parseResult);
      setUnmappedToResolve(parseResult.unmappedPositions);
      setIsImportSheetOpen(true);
      await loadData();

      // Автоматическая генерация AI-отчёта
      triggerAiReport(parseResult.reportPeriod);
    } catch (err: any) {
      alert(`Ошибка чтения Excel файла: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleResolveMapping = async (nameRaw: string, infusionId?: string | null, setId?: string | null) => {
    await dataService.saveNameMapping(nameRaw, infusionId, setId);
    setUnmappedToResolve(prev => prev.filter(p => p.nameRaw !== nameRaw));
    await loadData();
  };

  // Фильтрованные продажи для расчета
  const filteredSales = sales.filter(s => {
    const matchesPeriod = !selectedPeriod || s.report_period === selectedPeriod;
    const matchesVenue = selectedVenue === 'all' || s.venue_id === selectedVenue;
    return matchesPeriod && matchesVenue;
  });

  // Расчет ключевых агрегированных показателей
  const totalCost = filteredSales.reduce((sum, s) => sum + Number(s.cost || 0), 0);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.revenue || 0), 0);
  const totalMargin = totalRevenue - totalCost;
  const totalPortions = filteredSales.reduce((sum, s) => sum + Number(s.portions_qty || 0), 0);

  // Топ настойка по порциям
  const infusionPortionsMap: Record<string, { qty: number; name: string }> = {};
  const setPortionsMap: Record<string, { qty: number; name: string }> = {};

  for (const s of filteredSales) {
    if (s.position_type === 'сет') {
      const k = s.set_id || s.name_raw;
      setPortionsMap[k] = setPortionsMap[k] || { qty: 0, name: s.name_raw };
      setPortionsMap[k].qty += s.portions_qty;
    } else {
      const k = s.infusion_id || s.name_raw;
      infusionPortionsMap[k] = infusionPortionsMap[k] || { qty: 0, name: s.name_raw };
      infusionPortionsMap[k].qty += s.portions_qty;
    }
  }

  const sortedInfusions = Object.values(infusionPortionsMap).sort((a, b) => b.qty - a.qty);
  const sortedSets = Object.values(setPortionsMap).sort((a, b) => b.qty - a.qty);

  const topInfusion = sortedInfusions[0]?.name || 'нет данных';
  const topSet = sortedSets[0]?.name || 'нет данных';

  // Показатели по заведениям
  const venueStats = venues.filter(v => v.kind === 'venue').map(v => {
    const vSales = sales.filter(s => s.venue_id === v.id && (!selectedPeriod || s.report_period === selectedPeriod));
    const cost = vSales.reduce((acc, s) => acc + Number(s.cost || 0), 0);
    const revenue = vSales.reduce((acc, s) => acc + Number(s.revenue || 0), 0);
    return {
      id: v.id,
      name: v.name,
      cost,
      revenue,
      margin: revenue - cost
    };
  });

  // Генерация AI отчета
  const triggerAiReport = async (period: string) => {
    setGeneratingAiReport(true);
    try {
      const text = await dataService.generateAiMonthlyReport({
        period,
        totalCost,
        totalRevenue,
        totalPortions,
        topInfusion,
        topSet,
        venues: venueStats
      });
      setAiReportText(text);
    } catch {
      // Игнорируем
    } finally {
      setGeneratingAiReport(false);
    }
  };

  // Экспорт в PDF (jspdf)
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Отчет по продажам настоек — Сеть «Мордовское подворье»', 14, 20);

    doc.setFontSize(11);
    doc.text(`Отчетный период: ${selectedPeriod}`, 14, 30);
    doc.text(`Выручка сети: ${totalRevenue.toLocaleString('ru-RU')} руб.`, 14, 38);
    doc.text(`Себестоимость: ${totalCost.toLocaleString('ru-RU')} руб.`, 14, 46);
    doc.text(`Маржа: ${totalMargin.toLocaleString('ru-RU')} руб.`, 14, 54);
    doc.text(`Реализовано порций: ${totalPortions}`, 14, 62);
    doc.text(`Самая популярная настойка: ${topInfusion}`, 14, 70);
    doc.text(`Самый популярный сет: ${topSet}`, 14, 78);

    doc.save(`Nastoyki_Report_${selectedPeriod}.pdf`);
  };

  // Экспорт в Excel (SheetJS)
  const handleExportExcel = () => {
    const rows = filteredSales.map(s => ({
      'Период': s.report_period,
      'Заведение': venues.find(v => v.id === s.venue_id)?.name || s.venue_id,
      'Тип': s.position_type,
      'Блюдо': s.name_raw,
      'Порций': s.portions_qty,
      'Размер (мл)': s.portion_size,
      'Себестоимость (руб)': s.cost,
      'Выручка (руб)': s.revenue,
      'Маржа (руб)': s.revenue - s.cost
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Продажи');
    XLSX.writeFile(wb, `Nastoyki_Sales_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Шапка и кнопка импорта Excel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="text-brand-primary" />
            Финансовая аналитика продаж
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Импорт отчётов бухгалтерии Excel (не влияет на остатки сырья)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0">
            <Upload size={16} />
            <span>{importing ? 'Импорт...' : 'Импорт Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Панель фильтров формирования отчета */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
            <Filter size={15} className="text-brand-primary" />
            <span>Параметры отчёта:</span>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none w-full sm:w-auto"
            >
              <option value="2026-11-01">Ноябрь 2026</option>
              <option value="2026-10-01">Октябрь 2026</option>
            </select>

            <select
              value={selectedVenue}
              onChange={e => setSelectedVenue(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none w-full sm:w-auto max-w-full truncate"
            >
              <option value="all">Все заведения сети</option>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-colors"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Download size={14} />
            <span>PDF-отчёт</span>
          </button>
        </div>
      </div>

      {/* Ключевые метрики (Сводная карточка) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800">
          <div className="text-[11px] font-bold uppercase text-stone-500">Выручка сети</div>
          <div className="text-base sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {totalRevenue.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 truncate">по данным бухгалтерии</div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800">
          <div className="text-[11px] font-bold uppercase text-stone-500">Себестоимость</div>
          <div className="text-base sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {totalCost.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 truncate">из шаблона Excel</div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800">
          <div className="text-[11px] font-bold uppercase text-stone-500">Валовая маржа</div>
          <div className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {totalMargin.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            {totalRevenue > 0 ? `${((totalMargin / totalRevenue) * 100).toFixed(1)}% рентаб.` : '—'}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800">
          <div className="text-[11px] font-bold uppercase text-stone-500">Продано порций</div>
          <div className="text-base sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
            {totalPortions}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 truncate">по 40 мл / сет</div>
        </div>
      </div>

      {/* Лидеры продаж сети */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            🏆 Топ-настойка сети (по порциям)
          </div>
          <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 mt-1">
            {topInfusion}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Лидер спроса во всех трёх заведениях сети
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            🍸 Топ-сет настоек (по порциям)
          </div>
          <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 mt-1">
            {topSet}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Самый заказываемый дегустационный сет меню
          </div>
        </div>
      </div>

      {/* График сравнения заведений */}
      <div className="p-5 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Выручка и себестоимость по заведениям (руб.)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={venueStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(val: any) => `${Number(val).toLocaleString('ru-RU')} ₽`} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="revenue" name="Выручка" fill="#8B1A1A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cost" name="Себестоимость" fill="#E8A33D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI-отчёт шеф-бармена */}
      <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-900 border border-amber-200 dark:border-stone-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-primary dark:text-brand-amber" />
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              AI-отчёт шеф-бармена (YandexGPT)
            </h3>
          </div>
          <button
            onClick={() => triggerAiReport(selectedPeriod)}
            disabled={generatingAiReport}
            className="text-xs font-bold text-brand-primary dark:text-brand-amber hover:underline"
          >
            {generatingAiReport ? 'Формирование...' : 'Обновить анализ'}
          </button>
        </div>

        {aiReportText ? (
          <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line p-3 bg-white/70 dark:bg-stone-800/60 rounded-xl border border-amber-100 dark:border-stone-700">
            {aiReportText}
          </div>
        ) : (
          <p className="text-xs text-stone-500">
            Нажмите кнопку «Обновить анализ» или импортируйте Excel-файл для автоматической генерации сводки шеф-бармена.
          </p>
        )}
      </div>

      {/* Шторка результатов импорта Excel */}
      <BottomSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        title="Сводка импорта отчета Excel"
      >
        <div className="space-y-4">
          {importSummary && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                  <div className="text-base">{importSummary.itemsToInsert.length}</div>
                  <div>Внесено строк</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-bold">
                  <div className="text-base">{importSummary.skippedDuplicates}</div>
                  <div>Пропущено дублей</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 font-bold">
                  <div className="text-base">{importSummary.errors.length}</div>
                  <div>Ошибок данных</div>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle size={14} /> Ошибки в строках файла:
                  </div>
                  {importSummary.errors.map((e, idx) => (
                    <p key={idx}>• {e.message}</p>
                  ))}
                </div>
              )}

              {/* Ручное сопоставление нераспознанных названий */}
              {unmappedToResolve.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <h4 className="text-xs font-bold text-stone-700">
                    Нераспознанные позиции ({unmappedToResolve.length}). Выберите настойку/сет:
                  </h4>
                  {unmappedToResolve.map((u, i) => (
                    <div key={i} className="p-2.5 bg-stone-100 rounded-xl space-y-1.5 text-xs">
                      <div className="font-bold text-stone-900">{u.nameRaw} ({u.portionsQty} порц.)</div>
                      <div className="flex gap-2">
                        <select
                          onChange={e => handleResolveMapping(u.nameRaw, e.target.value, null)}
                          className="flex-1 p-1.5 bg-white border rounded text-xs"
                        >
                          <option value="">Сопоставить с настойкой...</option>
                          {infusions.map(inf => (
                            <option key={inf.id} value={inf.id}>{inf.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsImportSheetOpen(false)}
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs mt-2"
              >
                Закрыть и перейти к статистике
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
