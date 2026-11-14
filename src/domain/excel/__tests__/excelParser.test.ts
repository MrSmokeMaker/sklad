// src/domain/excel/__tests__/excelParser.test.ts: Тесты парсера Excel и токенизации

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  normalizeTokenizedName,
  parseReportPeriod,
  matchVenueId,
  isSummaryOrSkipRow,
  parseExcelReport
} from '../excelParser';
import { Sale, NameMapping, Infusion, InfusionSet } from '../../../types';

describe('Токенизация и сопоставление названий позиций', () => {
  it('нормализует строку с суффиксами и разным порядком слов', () => {
    const raw1 = 'Сливочная Халва 40 гр Настойка П';
    const raw2 = 'Настойка Сливочная халва';
    const norm1 = normalizeTokenizedName(raw1);
    const norm2 = normalizeTokenizedName(raw2);

    expect(norm1).toEqual(norm2);
    expect(norm1).toBe('сливочная халва');
  });

  it('корректно очищает суффиксы «40 мл», «40 гр», «П»', () => {
    const raw = 'Настойка на вяленых томатах 40 гр П';
    const norm = normalizeTokenizedName(raw);
    expect(norm).toBe('вяленых на томатах');
  });

  it('корректно нормализует названия сетов', () => {
    const raw = 'Сет №8 Адмирала Ушакова П';
    const norm = normalizeTokenizedName(raw);
    expect(norm).toContain('адмирала');
    expect(norm).toContain('ушакова');
    expect(norm).toContain('8');
  });
});

describe('Парсинг шапки и правил пропуска строк', () => {
  it('распознает дату периода «Период: с 01.11.2026 по 30.11.2026»', () => {
    const header = 'Период: с 01.11.2026 по 30.11.2026';
    const { reportPeriod } = parseReportPeriod(header);
    expect(reportPeriod).toBe('2026-11-01');
  });

  it('сопоставляет псевдоним ресторана «Капитал-Инвест» с venue-samovar', () => {
    const venueId = matchVenueId('Название ресторана: ООО «Капитал-Инвест»');
    expect(venueId).toBe('venue-samovar');
  });

  it('пропускает итоговые строки «Подворье - Бар всего» и «Итого»', () => {
    expect(isSummaryOrSkipRow(['Подворье - Бар всего', ''])).toBe(true);
    expect(isSummaryOrSkipRow(['Итого', ''])).toBe(true);
    expect(isSummaryOrSkipRow(['', ''])).toBe(true);
    expect(isSummaryOrSkipRow(['Бар', 'Настойка на вяленых томатах'])).toBe(false);
  });
});

describe('Комплексный парсинг листа Excel со спецификацией шаблона', () => {
  it('успешно парсит строки с пустой колонкой D, числом 34.000 и исключает строку всего', () => {
    // Генерация листа в памяти
    const rows = [
      ['Отчет по настойкам для бухгалтерии'],
      ['Название ресторана: Капитал-Инвест'],
      ['Период: с 01.11.2026 по 30.11.2026'],
      ['Со склада', 'Блюдо', 'Количество блюд', '', 'Себестоимость, р.', 'Сумма со скидкой, р.'],
      ['Бар', 'Настойка на вяленых томатах 40 гр П', '34.000', '', '1306.95', '8500.00'],
      ['Бар', 'Сет №8 Адмирала Ушакова П', '18.000', '', '2160.00', '10800.00'],
      ['Бар', 'Сливочная Халва 40 гр Настойка П', '20.000', '', '800.00', '5000.00'],
      ['Подворье - Бар всего', '', '', '', '4266.95', '24300.00']
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TDSheet');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const existingSales: Sale[] = [];
    const infusions: Infusion[] = [
      { id: 'inf-01', name: 'Настойка на вяленых томатах' },
      { id: 'inf-06', name: 'Настойка Сливочная халва' }
    ];
    const sets: InfusionSet[] = [
      { id: 'set-01', title: 'Сет №8 Адмирала Ушакова', composition: [] }
    ];
    const mappings: NameMapping[] = [
      { id: 'm-1', name_raw: 'сливочная халва 40 гр настойка п', infusion_id: 'inf-06' }
    ];

    const result = parseExcelReport(buffer, existingSales, mappings, infusions, sets);

    expect(result.reportPeriod).toBe('2026-11-01');
    expect(result.venueId).toBe('venue-samovar');
    // Должно быть распознано 3 строки
    expect(result.itemsToInsert.length).toBe(3);
    expect(result.errors.length).toBe(0);

    const tomato = result.itemsToInsert.find(i => i.name_raw.includes('вяленых'));
    expect(tomato).toBeDefined();
    expect(tomato?.portions_qty).toBe(34);
    expect(tomato?.cost).toBe(1306.95);
    expect(tomato?.revenue).toBe(8500);

    const setItem = result.itemsToInsert.find(i => i.name_raw.includes('Сет №8'));
    expect(setItem?.position_type).toBe('сет');
    expect(setItem?.set_id).toBe('set-01');
  });
});
