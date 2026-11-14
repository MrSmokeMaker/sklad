// src/domain/excel/excelParser.ts: Модуль парсинга, токенизации и валидации отчетов Excel бухгалтерии

import * as XLSX from 'xlsx';
import mappingConfig from '../../config/excelMapping.json';
import { Sale, NameMapping, Infusion, InfusionSet } from '../../types';

export interface ParseResult {
  restaurantRaw: string;
  venueId: string | null;
  periodRaw: string;
  reportPeriod: string; // YYYY-MM-01
  itemsToInsert: Omit<Sale, 'id' | 'created_at'>[];
  skippedDuplicates: number;
  unmappedPositions: Array<{
    lineNum: number;
    nameRaw: string;
    isSet: boolean;
    portionsQty: number;
    cost: number;
    revenue: number;
  }>;
  errors: Array<{ line: number; message: string }>;
}

const STOP_TOKENS = new Set([
  '40', 'гр', 'мл', '40гр', '40мл', 'настойка', 'сет', 'п', 'порция'
]);

/**
 * Токенизированная нормализация названий позиций:
 * Удаляет размер («40 гр», «40 мл»), «П», «Настойка», «Сет», знаки пунктуации,
 * приводит к нижнему регистру, сортирует слова по алфавиту для независимости от порядка слов.
 */
export function normalizeTokenizedName(rawName: string): string {
  if (!rawName) return '';

  const cleaned = rawName
    .toLowerCase()
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/gi, ' ');

  // Токенизируем, убираем стоп-токены и сортируем
  const tokens = cleaned
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !STOP_TOKENS.has(t));

  return tokens.sort().join(' ');
}

/**
 * Парсинг строки периода вида «Период: с 01.11.2026 по 30.11.2026» в дату первого числа месяца YYYY-MM-01
 */
export function parseReportPeriod(text: string): { periodRaw: string; reportPeriod: string } {
  const match = text.match(/с\s*(\d{2})\.(\d{2})\.(\d{4})/i) || text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) {
    const [, , month, year] = match.length === 4 ? match : ['', '', match[2], match[3]];
    return {
      periodRaw: text,
      reportPeriod: `${year}-${month}-01`
    };
  }
  // Fallback: текущий месяц
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    periodRaw: text,
    reportPeriod: `${y}-${m}-01`
  };
}

/**
 * Определение venue_id по имени ресторана из шапки отчета
 */
export function matchVenueId(rawRestaurant: string): string | null {
  const clean = rawRestaurant.toLowerCase().trim();
  const aliases = mappingConfig.restaurantAliases as Record<string, string>;

  for (const [alias, venueId] of Object.entries(aliases)) {
    if (clean.includes(alias)) {
      return venueId;
    }
  }
  return null;
}

/**
 * Проверка, является ли строка итоговой или заголовком, который нужно пропустить
 */
export function isSummaryOrSkipRow(row: any[]): boolean {
  if (!row || row.length === 0) return true;
  const firstCol = String(row[0] || '').toLowerCase().trim();
  const secondCol = String(row[1] || '').toLowerCase().trim();

  if (!firstCol && !secondCol) return true;

  const combined = `${firstCol} ${secondCol}`;

  for (const pattern of mappingConfig.skipPatterns) {
    if (combined.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Парсер файла Excel (ArrayBuffer / Uint8Array)
 */
export function parseExcelReport(
  fileData: ArrayBuffer | Uint8Array,
  existingSales: Sale[],
  nameMappings: NameMapping[],
  infusions: Infusion[],
  sets: InfusionSet[],
  forcedVenueId?: string | null
): ParseResult {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Преобразуем лист в массив строк
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  let restaurantRaw = '';
  let venueId: string | null = forcedVenueId || null;
  let periodRaw = '';
  let reportPeriod = '';

  const errors: Array<{ line: number; message: string }> = [];
  const unmappedPositions: ParseResult['unmappedPositions'] = [];
  const itemsToInsert: Omit<Sale, 'id' | 'created_at'>[] = [];
  let skippedDuplicates = 0;

  // 1. Поиск метаданных в шапке (первые 12 строк)
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const rowStr = rows[i].map(c => String(c)).join(' ');

    if (/название ресторана:/i.test(rowStr)) {
      const match = rowStr.match(/название ресторана:\s*([^;,\n]+)/i);
      if (match && match[1]) {
        restaurantRaw = match[1].trim();
        if (!venueId) {
          venueId = matchVenueId(restaurantRaw);
        }
      }
    }

    if (/период:/i.test(rowStr)) {
      const parsed = parseReportPeriod(rowStr);
      periodRaw = parsed.periodRaw;
      reportPeriod = parsed.reportPeriod;
    }
  }

  if (!reportPeriod) {
    const parsed = parseReportPeriod('');
    periodRaw = 'Период по умолчанию';
    reportPeriod = parsed.reportPeriod;
  }

  // Подготовка словарей для быстрого токенизированного сопоставления
  const mappingDict = new Map<string, { infusion_id?: string | null; set_id?: string | null }>();
  for (const m of nameMappings) {
    mappingDict.set(m.name_raw.toLowerCase().trim(), { infusion_id: m.infusion_id, set_id: m.set_id });
    mappingDict.set(normalizeTokenizedName(m.name_raw), { infusion_id: m.infusion_id, set_id: m.set_id });
  }

  const infusionTokenDict = new Map<string, string>();
  for (const inf of infusions) {
    infusionTokenDict.set(normalizeTokenizedName(inf.name), inf.id);
  }

  const setTokenDict = new Map<string, string>();
  for (const st of sets) {
    setTokenDict.set(normalizeTokenizedName(st.title), st.id);
  }

  // Быстрая проверка дедупликации
  const existingSet = new Set(
    existingSales.map(s => `${s.report_period}|${s.venue_id}|${s.name_raw.toLowerCase().trim()}`)
  );

  // 2. Построчный парсинг таблицы данных
  for (let idx = 0; idx < rows.length; idx++) {
    const lineNum = idx + 1;
    const row = rows[idx];

    // Пропуск пустых строк и итоговых
    if (isSummaryOrSkipRow(row)) {
      continue;
    }

    const posName = String(row[mappingConfig.columns.positionName] || '').trim();
    const qtyRaw = row[mappingConfig.columns.quantity];
    const costRaw = row[mappingConfig.columns.cost];
    const revenueRaw = row[mappingConfig.columns.revenue];

    // Если нет названия позиции — пропускаем
    if (!posName) continue;

    // Валидация числовых значений
    const portionsQty = typeof qtyRaw === 'number' ? qtyRaw : parseFloat(String(qtyRaw).replace(',', '.'));
    const cost = typeof costRaw === 'number' ? costRaw : parseFloat(String(costRaw).replace(',', '.'));
    const revenue = typeof revenueRaw === 'number' ? revenueRaw : parseFloat(String(revenueRaw).replace(',', '.'));

    if (isNaN(portionsQty) || portionsQty <= 0) {
      errors.push({ line: lineNum, message: `Строка ${lineNum}: некорректное количество порций «${qtyRaw}» для «${posName}»` });
      continue;
    }

    if (isNaN(cost) || isNaN(revenue)) {
      errors.push({ line: lineNum, message: `Строка ${lineNum}: пустая или некорректная себестоимость/сумма для «${posName}»` });
      continue;
    }

    // Классификация: Сет или Настойка
    const isSet = /сет\s*№/i.test(posName);
    const positionType = isSet ? 'сет' : 'настойка';

    // Сопоставление названия:
    const lowerRaw = posName.toLowerCase().trim();
    const tokenized = normalizeTokenizedName(posName);

    let resolvedInfusionId: string | null = null;
    let resolvedSetId: string | null = null;

    if (mappingDict.has(lowerRaw)) {
      const match = mappingDict.get(lowerRaw)!;
      resolvedInfusionId = match.infusion_id || null;
      resolvedSetId = match.set_id || null;
    } else if (mappingDict.has(tokenized)) {
      const match = mappingDict.get(tokenized)!;
      resolvedInfusionId = match.infusion_id || null;
      resolvedSetId = match.set_id || null;
    } else if (isSet && setTokenDict.has(tokenized)) {
      resolvedSetId = setTokenDict.get(tokenized)!;
    } else if (!isSet && infusionTokenDict.has(tokenized)) {
      resolvedInfusionId = infusionTokenDict.get(tokenized)!;
    } else {
      unmappedPositions.push({
        lineNum,
        nameRaw: posName,
        isSet,
        portionsQty,
        cost,
        revenue
      });
      continue;
    }

    const activeVenueId = venueId || 'venue-samovar';
    const dedupKey = `${reportPeriod}|${activeVenueId}|${lowerRaw}`;

    if (existingSet.has(dedupKey)) {
      skippedDuplicates++;
      continue;
    }

    existingSet.add(dedupKey);

    itemsToInsert.push({
      report_period: reportPeriod,
      venue_id: activeVenueId,
      position_type: positionType,
      infusion_id: resolvedInfusionId,
      set_id: resolvedSetId,
      name_raw: posName,
      portions_qty: portionsQty,
      portion_size: isSet ? 120 : mappingConfig.defaultPortionSizeMl,
      cost,
      revenue,
      source: 'import'
    });
  }

  return {
    restaurantRaw,
    venueId,
    periodRaw,
    reportPeriod,
    itemsToInsert,
    skippedDuplicates,
    unmappedPositions,
    errors
  };
}
