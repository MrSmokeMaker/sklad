// src/db/mockData.ts: Локальная база данных для офлайн/демо-режима

import { Venue, Profile, InventoryItem, Recipe, Infusion, InfusionSet, Batch, Transfer, Sale, NameMapping, OperationsLog, Invite } from '../types';

export const INITIAL_VENUES: Venue[] = [
  { id: 'production-podvorie', name: 'Подворье - Бар', kind: 'production', is_active: true },
  { id: 'venue-samovar', name: 'Самовар', kind: 'venue', is_active: true },
  { id: 'venue-podvorie', name: 'Мордовское подворье', kind: 'venue', is_active: true },
  { id: 'venue-eva', name: 'Ева', kind: 'venue', is_active: true },
];

export const INITIAL_PROFILES: Profile[] = [
  { id: 'usr-owner-01', email: 'owner@podvorie.ru', full_name: 'Шеф-бармен (Владелец)', role: 'owner', venue_id: 'production-podvorie' },
  { id: 'usr-staff-01', email: 'samovar@podvorie.ru', full_name: 'Бармен Алексей (Самовар)', role: 'staff', venue_id: 'venue-samovar' },
  { id: 'usr-staff-02', email: 'eva@podvorie.ru', full_name: 'Бармен Дарья (Ева)', role: 'staff', venue_id: 'venue-eva' },
  { id: 'usr-viewer-01', email: 'director@podvorie.ru', full_name: 'Управляющий сети', role: 'viewer', venue_id: null },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // Центральный склад «Подворье - Бар»
  { id: 'inv-01', name: 'Спирт люкс 96%', type: 'спирт', venue_id: 'production-podvorie', quantity: 48, unit: 'л', min_stock: 10, expiry_date: '2028-12-31' },
  { id: 'inv-02', name: 'Водка особая', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 28, unit: 'л', min_stock: 10, expiry_date: '2027-12-31' },
  { id: 'inv-03', name: 'Вишня свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 24, unit: 'кг', min_stock: 5, expiry_date: '2026-10-01' },
  { id: 'inv-04', name: 'Черная смородина', type: 'ягоды', venue_id: 'production-podvorie', quantity: 18, unit: 'кг', min_stock: 5, expiry_date: '2026-10-01' },
  { id: 'inv-05', name: 'Клюква лесная', type: 'ягоды', venue_id: 'production-podvorie', quantity: 19, unit: 'кг', min_stock: 5, expiry_date: '2026-10-01' },
  { id: 'inv-06', name: 'Брусника таежная', type: 'ягоды', venue_id: 'production-podvorie', quantity: 14, unit: 'кг', min_stock: 4, expiry_date: '2026-10-01' },
  { id: 'inv-07', name: 'Рябина красная', type: 'ягоды', venue_id: 'production-podvorie', quantity: 12, unit: 'кг', min_stock: 3, expiry_date: '2026-10-01' },
  { id: 'inv-08', name: 'Яблоки сушеные', type: 'фрукты', venue_id: 'production-podvorie', quantity: 9, unit: 'кг', min_stock: 2, expiry_date: '2026-12-31' },
  { id: 'inv-09', name: 'Мёд липовый мордовский', type: 'мёд', venue_id: 'production-podvorie', quantity: 14, unit: 'кг', min_stock: 3, expiry_date: '2027-06-01' },
  { id: 'inv-10', name: 'Сахар-песок', type: 'бакалея', venue_id: 'production-podvorie', quantity: 38, unit: 'кг', min_stock: 10, expiry_date: '2028-01-01' },
  { id: 'inv-11', name: 'Вяленые томаты', type: 'специи/овощи', venue_id: 'production-podvorie', quantity: 7.5, unit: 'кг', min_stock: 2, expiry_date: '2026-08-01' },
  { id: 'inv-12', name: 'Хрен свежий корень', type: 'коренья', venue_id: 'production-podvorie', quantity: 5.2, unit: 'кг', min_stock: 1.5, expiry_date: '2026-06-01' },
  { id: 'inv-13', name: 'Гвоздика целая', type: 'пряности', venue_id: 'production-podvorie', quantity: 2, unit: 'кг', min_stock: 0.5, expiry_date: '2027-12-31' },
  { id: 'inv-14', name: 'Дубовая щепа сильного обжига', type: 'древесина', venue_id: 'production-podvorie', quantity: 5, unit: 'кг', min_stock: 1, expiry_date: '2029-12-31' },

  // Заведения
  { id: 'inv-15', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-samovar', quantity: 4.5, unit: 'кг', min_stock: 2 },
  { id: 'inv-16', name: 'Мёд липовый мордовский', type: 'мёд', venue_id: 'venue-samovar', quantity: 2.1, unit: 'кг', min_stock: 1 },
  { id: 'inv-17', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-podvorie', quantity: 5.5, unit: 'кг', min_stock: 2 },
  { id: 'inv-18', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-eva', quantity: 3.2, unit: 'кг', min_stock: 2 },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rcp-01',
    title: 'Настойка на вяленых томатах',
    ingredients: [
      { name: 'Спирт люкс 96%', qty: 450, unit: 'мл' },
      { name: 'Вяленые томаты', qty: 200, unit: 'г' },
      { name: 'Гвоздика целая', qty: 3, unit: 'г' },
    ],
    base_volume_мл: 1000,
    days: 10,
    target_abv: 38,
    yield_мл: 920,
    loss_pct: 8,
    steps: '1. Нарезать томаты соломкой. 2. Залить спиртовой смесью 40%. 3. Выдержать 10 дней в темноте. 4. Профильтровать.',
    category: 'пряная',
    notes: 'Гастрономическая настойка, подавать слегка охлажденной.'
  },
  {
    id: 'rcp-02',
    title: 'Настойка на черной смородине',
    ingredients: [
      { name: 'Спирт люкс 96%', qty: 420, unit: 'мл' },
      { name: 'Черная смородина', qty: 350, unit: 'г' },
      { name: 'Сахар-песок', qty: 80, unit: 'г' },
    ],
    base_volume_мл: 1000,
    days: 14,
    target_abv: 35,
    yield_мл: 900,
    loss_pct: 10,
    steps: '1. Ягоды размять с сахаром. 2. Залить основой. 3. Настаивать 14 суток. 4. Двойная фильтрация через кофейный фильтр.',
    category: 'ягодная',
    notes: 'Хит продаж сети, насыщенный ягодный рубин.'
  },
  {
    id: 'rcp-03',
    title: 'Настойка Хреновуха',
    ingredients: [
      { name: 'Водка особая', qty: 950, unit: 'мл' },
      { name: 'Хрен свежий корень', qty: 80, unit: 'г' },
      { name: 'Мёд липовый мордовский', qty: 50, unit: 'г' },
      { name: 'Гвоздика целая', qty: 2, unit: 'г' },
    ],
    base_volume_мл: 1000,
    days: 5,
    target_abv: 38,
    yield_мл: 950,
    loss_pct: 5,
    steps: '1. Хрен натереть полосками. 2. Мед растворить в теплой водке. 3. Настаивать ровно 5 дней (не более!). 4. Тщательно процедить.',
    category: 'пряная',
    notes: 'Подавать ледяной к горячим мясным блюдам.'
  },
  {
    id: 'rcp-04',
    title: 'Настойка на клюкве',
    ingredients: [
      { name: 'Спирт люкс 96%', qty: 430, unit: 'мл' },
      { name: 'Клюква лесная', qty: 350, unit: 'г' },
      { name: 'Сахар-песок', qty: 100, unit: 'г' },
    ],
    base_volume_мл: 1000,
    days: 14,
    target_abv: 34,
    yield_мл: 910,
    loss_pct: 9,
    steps: '1. Клюкву проколоть иглой. 2. Смешать с сахаром и алкоголем. 3. Выдержать 2 недели.',
    category: 'ягодная',
    notes: 'Мягкая женская настойка с приятной кислинкой.'
  },
  {
    id: 'rcp-05',
    title: 'Настойка Мордовская',
    ingredients: [
      { name: 'Спирт люкс 96%', qty: 450, unit: 'мл' },
      { name: 'Рябина красная', qty: 200, unit: 'г' },
      { name: 'Яблоки сушеные', qty: 100, unit: 'г' },
      { name: 'Мёд липовый мордовский', qty: 70, unit: 'г' },
      { name: 'Дубовая щепа сильного обжига', qty: 10, unit: 'г' },
    ],
    base_volume_мл: 1000,
    days: 21,
    target_abv: 40,
    yield_мл: 880,
    loss_pct: 12,
    steps: '1. Щепу ошпарить. 2. Смешать рябину, яблоки, мед и спирт. 3. Выдержка 21 день. 4. Отдых в стекле 3 дня.',
    category: 'наливка',
    notes: 'Традиционный рецепт Мордовии.'
  }
];

export const INITIAL_INFUSIONS: Infusion[] = [
  { id: 'inf-01', name: 'Настойка на вяленых томатах', recipe_id: 'rcp-01' },
  { id: 'inf-02', name: 'Настойка на черной смородине', recipe_id: 'rcp-02' },
  { id: 'inf-03', name: 'Настойка Хреновуха', recipe_id: 'rcp-03' },
  { id: 'inf-04', name: 'Настойка на клюкве', recipe_id: 'rcp-04' },
  { id: 'inf-05', name: 'Настойка Мордовская', recipe_id: 'rcp-05' },
  { id: 'inf-06', name: 'Настойка Сливочная халва', recipe_id: null },
];

export const INITIAL_SETS: InfusionSet[] = [
  {
    id: 'set-01',
    title: 'Сет №8 Адмирала Ушакова',
    composition: [
      { infusion_id: 'inf-01', qty_шт: 1 },
      { infusion_id: 'inf-03', qty_шт: 1 },
      { infusion_id: 'inf-05', qty_шт: 1 },
    ],
    notes: 'Мужской богатырский сет из 3 настоек'
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'bat-01',
    infusion_id: 'inf-01',
    venue_id: 'production-podvorie',
    volume_мл: 4600,
    start_date: '2026-10-01',
    ready_date: '2026-10-11',
    abv: 38,
    status: 'готово',
    rating: 5,
    notes: 'Партия №12: превосходный аромат вяленых томатов'
  },
  {
    id: 'bat-02',
    infusion_id: 'inf-02',
    venue_id: 'production-podvorie',
    volume_мл: 5400,
    start_date: '2026-10-05',
    ready_date: '2026-10-19',
    abv: 35,
    status: 'готово',
    rating: 4,
    notes: 'Партия №14: сбалансированная сладость'
  },
  {
    id: 'bat-03',
    infusion_id: 'inf-03',
    venue_id: 'production-podvorie',
    volume_мл: 3800,
    start_date: '2026-11-01',
    ready_date: '2026-11-06',
    abv: 38,
    status: 'готово',
    rating: 5,
    notes: 'Партия №15: правильная острота хрена'
  },
  {
    id: 'bat-04',
    infusion_id: 'inf-05',
    venue_id: 'production-podvorie',
    volume_мл: 7000,
    start_date: '2026-11-05',
    ready_date: '2026-11-26',
    abv: 40,
    status: 'настаивается',
    notes: 'Партия №16: созревание'
  },
  // Остатки готовых настоек на заведениях
  {
    id: 'bat-05',
    infusion_id: 'inf-01',
    venue_id: 'venue-samovar',
    volume_мл: 1600,
    start_date: '2026-10-12',
    ready_date: '2026-10-12',
    abv: 38,
    status: 'готово',
    notes: 'Принято с Подворья'
  },
  {
    id: 'bat-06',
    infusion_id: 'inf-02',
    venue_id: 'venue-samovar',
    volume_мл: 2200,
    start_date: '2026-10-20',
    ready_date: '2026-10-20',
    abv: 35,
    status: 'готово',
    notes: 'Принято с Подворья'
  }
];

export const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: 'tr-01',
    transfer_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    from_venue_id: 'production-podvorie',
    to_venue_id: 'venue-samovar',
    item_type: 'infusion',
    infusion_id: 'inf-01',
    batch_id: 'bat-01',
    qty: 2000,
    unit: 'мл'
  },
  {
    id: 'tr-02',
    transfer_date: new Date(Date.now() - 86400000 * 4).toISOString(),
    from_venue_id: 'production-podvorie',
    to_venue_id: 'venue-samovar',
    item_type: 'infusion',
    infusion_id: 'inf-02',
    batch_id: 'bat-02',
    qty: 2500,
    unit: 'мл'
  }
];

export const INITIAL_NAME_MAPPING: NameMapping[] = [
  { id: 'nm-01', name_raw: 'настойка на вяленых томатах 40 гр п', infusion_id: 'inf-01' },
  { id: 'nm-02', name_raw: 'настойка на черной смородине 40 гр п', infusion_id: 'inf-02' },
  { id: 'nm-03', name_raw: 'настойка хреновуха 40 гр п', infusion_id: 'inf-03' },
  { id: 'nm-04', name_raw: 'настойка на клюкве 40 гр п', infusion_id: 'inf-04' },
  { id: 'nm-05', name_raw: 'настойка мордовская 40 гр п', infusion_id: 'inf-05' },
  { id: 'nm-06', name_raw: 'сливочная халва 40 гр настойка п', infusion_id: 'inf-06' },
  { id: 'nm-07', name_raw: 'сет №8 адмирала ушакова п', set_id: 'set-01' }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sl-01',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'настойка',
    infusion_id: 'inf-01',
    name_raw: 'Настойка на вяленых томатах 40 гр П',
    portions_qty: 34,
    portion_size: 40,
    cost: 1306.95,
    revenue: 8500.00,
    source: 'import'
  },
  {
    id: 'sl-02',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'настойка',
    infusion_id: 'inf-02',
    name_raw: 'Настойка на черной смородине 40 гр П',
    portions_qty: 48,
    portion_size: 40,
    cost: 1728.00,
    revenue: 12000.00,
    source: 'import'
  },
  {
    id: 'sl-03',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'настойка',
    infusion_id: 'inf-03',
    name_raw: 'Настойка Хреновуха 40 гр П',
    portions_qty: 52,
    portion_size: 40,
    cost: 1872.00,
    revenue: 13000.00,
    source: 'import'
  },
  {
    id: 'sl-04',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'сет',
    set_id: 'set-01',
    name_raw: 'Сет №8 Адмирала Ушакова П',
    portions_qty: 18,
    portion_size: 120,
    cost: 2160.00,
    revenue: 10800.00,
    source: 'import'
  },
  {
    id: 'sl-05',
    report_period: '2026-11-01',
    venue_id: 'venue-podvorie',
    position_type: 'настойка',
    infusion_id: 'inf-02',
    name_raw: 'Настойка на черной смородине 40 гр П',
    portions_qty: 62,
    portion_size: 40,
    cost: 2232.00,
    revenue: 15500.00,
    source: 'import'
  },
  {
    id: 'sl-06',
    report_period: '2026-11-01',
    venue_id: 'venue-podvorie',
    position_type: 'настойка',
    infusion_id: 'inf-05',
    name_raw: 'Настойка Мордовская 40 гр П',
    portions_qty: 45,
    portion_size: 40,
    cost: 2025.00,
    revenue: 13500.00,
    source: 'import'
  },
  {
    id: 'sl-07',
    report_period: '2026-11-01',
    venue_id: 'venue-eva',
    position_type: 'настойка',
    infusion_id: 'inf-04',
    name_raw: 'Настойка на клюкве 40 гр П',
    portions_qty: 30,
    portion_size: 40,
    cost: 1080.00,
    revenue: 7500.00,
    source: 'import'
  }
];

export const INITIAL_OPERATIONS_LOG: OperationsLog[] = [
  {
    id: 'op-01',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    action: 'transfer_infusion',
    object: 'Настойка на вяленых томатах (2000 мл)',
    details: 'Перемещение с Подворье - Бар в Самовар',
    delta: {
      type: 'transfer_infusion',
      fromVenueId: 'production-podvorie',
      toVenueId: 'venue-samovar',
      infusionId: 'inf-01',
      volumeMl: 2000,
      deductions: [{ batchId: 'bat-01', volumeMl: 2000 }]
    }
  }
];

export const INITIAL_INVITES: Invite[] = [
  {
    id: 'inv-test-01',
    token: '7a19c5b2-3f28-4e1b-8517-91a02fa43e99',
    role: 'staff',
    venue_id: 'venue-samovar',
    created_by: 'usr-owner-01',
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    used_by: null,
    used_at: null
  }
];
