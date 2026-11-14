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
  // --- Алкогольные основы и дистилляты (Центральное производство «Подворье - Бар») ---
  { id: 'inv-01', name: 'Водка особая', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 95, unit: 'л', min_stock: 20, expiry_date: '2028-12-31' },
  { id: 'inv-02', name: 'Джин сухой', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 38, unit: 'л', min_stock: 10, expiry_date: '2028-12-31' },
  { id: 'inv-03', name: 'Джин Бомбей Брамбл', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 18, unit: 'л', min_stock: 5, expiry_date: '2028-12-31' },
  { id: 'inv-04', name: 'Ликер Амаретто', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 16, unit: 'л', min_stock: 5, expiry_date: '2028-12-31' },
  { id: 'inv-05', name: 'Настойка «Городок»', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 24, unit: 'л', min_stock: 6, expiry_date: '2027-12-31' },
  { id: 'inv-06', name: 'Настойка «Медовая»', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 26, unit: 'л', min_stock: 6, expiry_date: '2027-12-31' },
  { id: 'inv-07', name: 'Настойка «Яблоки на снегу»', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 22, unit: 'л', min_stock: 6, expiry_date: '2027-12-31' },
  { id: 'inv-08', name: 'Настойка «Иней рябина»', type: 'алкоголь', venue_id: 'production-podvorie', quantity: 20, unit: 'л', min_stock: 5, expiry_date: '2027-12-31' },
  { id: 'inv-09', name: 'Спирт люкс 96%', type: 'спирт', venue_id: 'production-podvorie', quantity: 40, unit: 'л', min_stock: 10, expiry_date: '2029-12-31' },
  { id: 'inv-10', name: 'Вода очищенная', type: 'вода', venue_id: 'production-podvorie', quantity: 120, unit: 'л', min_stock: 30, expiry_date: '2027-01-01' },

  // --- Ягоды и фрукты (свежие / с/м) ---
  { id: 'inv-11', name: 'Ежевика свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 28, unit: 'кг', min_stock: 5, expiry_date: '2027-10-01' },
  { id: 'inv-12', name: 'Клубника свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 24, unit: 'кг', min_stock: 5, expiry_date: '2027-10-01' },
  { id: 'inv-13', name: 'Малина свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 26, unit: 'кг', min_stock: 5, expiry_date: '2027-10-01' },
  { id: 'inv-14', name: 'Облепиха свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 22, unit: 'кг', min_stock: 4, expiry_date: '2027-10-01' },
  { id: 'inv-15', name: 'Вишня свежемороженая', type: 'ягоды', venue_id: 'production-podvorie', quantity: 30, unit: 'кг', min_stock: 6, expiry_date: '2027-10-01' },
  { id: 'inv-16', name: 'Клюква лесная', type: 'ягоды', venue_id: 'production-podvorie', quantity: 35, unit: 'кг', min_stock: 6, expiry_date: '2027-10-01' },
  { id: 'inv-17', name: 'Черная смородина', type: 'ягоды', venue_id: 'production-podvorie', quantity: 25, unit: 'кг', min_stock: 5, expiry_date: '2027-10-01' },
  { id: 'inv-18', name: 'Красная смородина', type: 'ягоды', venue_id: 'production-podvorie', quantity: 20, unit: 'кг', min_stock: 4, expiry_date: '2027-10-01' },
  { id: 'inv-19', name: 'Черника лесная', type: 'ягоды', venue_id: 'production-podvorie', quantity: 18, unit: 'кг', min_stock: 4, expiry_date: '2027-10-01' },
  { id: 'inv-20', name: 'Рябина черноплодная (арония)', type: 'ягоды', venue_id: 'production-podvorie', quantity: 16, unit: 'кг', min_stock: 4, expiry_date: '2027-10-01' },
  { id: 'inv-21', name: 'Барбарис сушеный', type: 'ягоды', venue_id: 'production-podvorie', quantity: 6.5, unit: 'кг', min_stock: 2, expiry_date: '2028-06-01' },
  { id: 'inv-22', name: 'Лимоны свежие', type: 'фрукты', venue_id: 'production-podvorie', quantity: 50, unit: 'шт', min_stock: 15, expiry_date: '2026-12-15' },
  { id: 'inv-23', name: 'Мандарины свежие', type: 'фрукты', venue_id: 'production-podvorie', quantity: 45, unit: 'шт', min_stock: 12, expiry_date: '2026-12-15' },
  { id: 'inv-24', name: 'Ананас свежий', type: 'фрукты', venue_id: 'production-podvorie', quantity: 15, unit: 'кг', min_stock: 3, expiry_date: '2026-12-10' },
  { id: 'inv-25', name: 'Манго спелое', type: 'фрукты', venue_id: 'production-podvorie', quantity: 12, unit: 'кг', min_stock: 3, expiry_date: '2026-12-10' },
  { id: 'inv-26', name: 'Маракуйя (плоды/пюре)', type: 'фрукты', venue_id: 'production-podvorie', quantity: 10, unit: 'кг', min_stock: 2.5, expiry_date: '2027-03-01' },
  { id: 'inv-27', name: 'Гранат свежий', type: 'фрукты', venue_id: 'production-podvorie', quantity: 9, unit: 'кг', min_stock: 2, expiry_date: '2026-12-20' },

  // --- Бакалея, травы, коренья и гастрономия ---
  { id: 'inv-28', name: 'Сахар-песок', type: 'бакалея', venue_id: 'production-podvorie', quantity: 60, unit: 'кг', min_stock: 15, expiry_date: '2029-01-01' },
  { id: 'inv-29', name: 'Мёд липовый мордовский', type: 'мёд', venue_id: 'production-podvorie', quantity: 18, unit: 'кг', min_stock: 5, expiry_date: '2028-06-01' },
  { id: 'inv-30', name: 'Хрен свежий корень', type: 'коренья', venue_id: 'production-podvorie', quantity: 14, unit: 'кг', min_stock: 3, expiry_date: '2027-01-15' },
  { id: 'inv-31', name: 'Имбирь свежий корень', type: 'коренья', venue_id: 'production-podvorie', quantity: 8, unit: 'кг', min_stock: 2, expiry_date: '2027-01-15' },
  { id: 'inv-32', name: 'Чай мокшанский травяной', type: 'чай', venue_id: 'production-podvorie', quantity: 8, unit: 'л', min_stock: 2, expiry_date: '2026-12-01' },
  { id: 'inv-33', name: 'Чай улун', type: 'чай', venue_id: 'production-podvorie', quantity: 8, unit: 'л', min_stock: 2, expiry_date: '2026-12-01' },
  { id: 'inv-34', name: 'Вяленые томаты', type: 'гастрономия', venue_id: 'production-podvorie', quantity: 11, unit: 'кг', min_stock: 3, expiry_date: '2027-08-01' },
  { id: 'inv-35', name: 'Сухари бородинские', type: 'бакалея', venue_id: 'production-podvorie', quantity: 6, unit: 'кг', min_stock: 1.5, expiry_date: '2027-04-01' },
  { id: 'inv-36', name: 'Кориандр зерно', type: 'пряности', venue_id: 'production-podvorie', quantity: 2, unit: 'кг', min_stock: 0.5, expiry_date: '2028-12-31' },
  { id: 'inv-37', name: 'Тмин цельный', type: 'пряности', venue_id: 'production-podvorie', quantity: 2, unit: 'кг', min_stock: 0.5, expiry_date: '2028-12-31' },
  { id: 'inv-38', name: 'Корица в палочках', type: 'пряности', venue_id: 'production-podvorie', quantity: 60, unit: 'шт', min_stock: 15, expiry_date: '2028-12-31' },
  { id: 'inv-39', name: 'Кокосовая стружка', type: 'бакалея', venue_id: 'production-podvorie', quantity: 3, unit: 'кг', min_stock: 0.5, expiry_date: '2027-12-31' },
  { id: 'inv-40', name: 'Свекла печеная', type: 'гастрономия', venue_id: 'production-podvorie', quantity: 8, unit: 'кг', min_stock: 2, expiry_date: '2026-11-30' },
  { id: 'inv-41', name: 'Чеснок свежий', type: 'гастрономия', venue_id: 'production-podvorie', quantity: 4, unit: 'кг', min_stock: 1, expiry_date: '2027-02-01' },
  { id: 'inv-42', name: 'Укроп свежий', type: 'зелень', venue_id: 'production-podvorie', quantity: 2.5, unit: 'кг', min_stock: 0.5, expiry_date: '2026-11-25' },

  // --- Запасы на торговых точках сети ---
  { id: 'inv-43', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-samovar', quantity: 6.0, unit: 'кг', min_stock: 2 },
  { id: 'inv-44', name: 'Мёд липовый мордовский', type: 'мёд', venue_id: 'venue-samovar', quantity: 2.5, unit: 'кг', min_stock: 1 },
  { id: 'inv-45', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-podvorie', quantity: 8.0, unit: 'кг', min_stock: 2 },
  { id: 'inv-46', name: 'Сахар-песок', type: 'бакалея', venue_id: 'venue-eva', quantity: 5.0, unit: 'кг', min_stock: 2 },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rcp-01',
    title: 'Мордовская «Тишень»',
    ingredients: [
      { name: 'Настойка «Городок»', qty: 1000, unit: 'мл' },
      { name: 'Чай мокшанский травяной', qty: 500, unit: 'мл' },
    ],
    base_volume_мл: 1500,
    days: 7,
    target_abv: 32,
    yield_мл: 1450,
    loss_pct: 3,
    steps: '1. Заварить крепкий мокшанский травяной сбор (душица, чабрец, иван-чай, зверобой) и остудить до комнатной температуры. 2. Профильтровать чай через бумажный фильтр. 3. Купажировать с настойкой «Городок». 4. Выдержать 7 дней в темном месте для отдыха и объединения букета.',
    category: 'пряная',
    notes: 'Традиционный мордовский степной купаж. Подавать охлажденным до +8...+10°C к горячим мясным блюдам.'
  },
  {
    id: 'rcp-02',
    title: 'Джин на ежевике',
    ingredients: [
      { name: 'Ежевика свежемороженая', qty: 900, unit: 'г' },
      { name: 'Джин сухой', qty: 1100, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
    ],
    base_volume_мл: 1500,
    days: 21,
    target_abv: 29,
    yield_мл: 1380,
    loss_pct: 8,
    steps: '1. Разморозить ежевику и слегка размять ягоды прессом. 2. Сварить сироп из 400 мл воды и 300 г сахара, охладить. 3. Соединить ежевику, джин и сироп в банке. 4. Настаивать 21 день при ежедневном взбалтывании в первую неделю. 5. Двойная фильтрация через марлю и кофейный фильтр.',
    category: 'ягодная',
    notes: 'Премиальный рубиновый цвет и смолистый хвойный букет. Подавать ледяной.'
  },
  {
    id: 'rcp-03',
    title: 'Хреновуха',
    ingredients: [
      { name: 'Хрен свежий корень', qty: 450, unit: 'г' },
      { name: 'Мёд липовый мордовский', qty: 60, unit: 'г' },
      { name: 'Водка особая', qty: 1500, unit: 'мл' },
    ],
    base_volume_мл: 1500,
    days: 5,
    target_abv: 38,
    yield_мл: 1420,
    loss_pct: 5,
    steps: '1. Свежий корень хрена тщательно очистить и нарезать тонкой соломкой (не тереть на терке во избежание горечи!). 2. Растворить мед в 100 мл теплой водки. 3. Залить нарезанный хрен водкой и добавить медовый раствор. 4. Настаивать строго 5 дней в темном прохладном месте. 5. Тщательно отфильтровать.',
    category: 'гастрономическая',
    notes: 'Классический богатырский аперитив под студень и соленья. Подавать ледяной в запотевших рюмках.'
  },
  {
    id: 'rcp-04',
    title: 'Медовуха',
    ingredients: [
      { name: 'Настойка «Медовая»', qty: 1500, unit: 'мл' },
      { name: 'Мёд липовый мордовский', qty: 225, unit: 'г' },
      { name: 'Лимоны свежие', qty: 1.5, unit: 'шт' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 28,
    yield_мл: 1460,
    loss_pct: 3,
    steps: '1. Лимоны ошпарить, нарезать дольками вместе со свежей цедрой. 2. Мед липовый смешать с частью медовой настойки до полного растворения. 3. Соединить все компоненты в емкости. 4. Выдержать 14 суток, периодически покачивая. 5. Процедить через тонкое сито и дать отдохнуть 3 дня.',
    category: 'десертная',
    notes: 'Шелковистая текстура, янтарный перелив и согревающий цитрусово-медовый баланс.'
  },
  {
    id: 'rcp-05',
    title: 'Клубника на Джине',
    ingredients: [
      { name: 'Джин сухой', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Клубника свежемороженая', qty: 600, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 30,
    yield_мл: 1400,
    loss_pct: 7,
    steps: '1. Клубнику разморозить и слегка растолочь. 2. Приготовить легкий сахарный сироп из воды и сахара. 3. Залить ягоды сухим джином и сиропом. 4. Настаивать 14 дней в темном помещении при температуре 18-20°C. 5. Отфильтровать через кофейный фильтр.',
    category: 'ягодная',
    notes: 'Летний аромат садовой клубники с благородным сухим можжевеловым финишем.'
  },
  {
    id: 'rcp-06',
    title: 'Малиновый чай',
    ingredients: [
      { name: 'Малина свежемороженая', qty: 600, unit: 'г' },
      { name: 'Водка особая', qty: 1000, unit: 'мл' },
      { name: 'Чай улун', qty: 500, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 27,
    yield_мл: 1390,
    loss_pct: 7,
    steps: '1. Малину смешать с сахаром и залить водкой на 10 дней. 2. Заварить крепкий чай улун (500 мл), охладить и профильтровать. 3. Смешать ягодный мацерат с чайным настоем. 4. Выдержать еще 4 дня для гармонизации букета. 5. Тонкая фильтрация.',
    category: 'ягодная',
    notes: 'Мягкий ягодный настой с тонкой благородной чайной танинностью.'
  },
  {
    id: 'rcp-07',
    title: 'Имбирно-лимонная',
    ingredients: [
      { name: 'Имбирь свежий корень', qty: 150, unit: 'г' },
      { name: 'Лимоны свежие', qty: 1, unit: 'шт' },
      { name: 'Мёд липовый мордовский', qty: 45, unit: 'г' },
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
    ],
    base_volume_мл: 1500,
    days: 10,
    target_abv: 31,
    yield_мл: 1430,
    loss_pct: 5,
    steps: '1. Имбирь очистить и нарезать тонкими пластинками. 2. Лимон ошпарить, нарезать дольками с цедрой, удалить косточки. 3. Растворить мед в воде. 4. Соединить с водкой и выдержать 10 дней в прохладе. 5. Процедить.',
    category: 'цитрусовая',
    notes: 'Взрыв цитрусовой бодрости и согревающего перечного тепла.'
  },
  {
    id: 'rcp-08',
    title: 'Облепиховая',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Облепиха свежемороженая', qty: 600, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 21,
    target_abv: 29,
    yield_мл: 1390,
    loss_pct: 7,
    steps: '1. Облепиху разморозить и бланшировать или слегка подмять. 2. Сварить сироп из воды и сахара, остудить. 3. Залить водкой с сиропом. 4. Выдержать 21 день в темном месте. 5. Деликатно снять с осадка и профильтровать маслянистый слой.',
    category: 'ягодная',
    notes: 'Янтарный цвет, густая маслянистая текстура и деликатная кислинка с нотами ананаса.'
  },
  {
    id: 'rcp-09',
    title: 'Пряная вишня',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Вишня свежемороженая', qty: 600, unit: 'г' },
      { name: 'Корица в палочках', qty: 1, unit: 'шт' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 18,
    target_abv: 30,
    yield_мл: 1400,
    loss_pct: 7,
    steps: '1. Вишню разморозить (сок сохранить). 2. Палочку корицы слегка надломить. 3. Растворить сахар в воде, соединить с водкой, вишней и корицей. 4. Настаивать 18 дней в темноте. 5. Процедить через плотную ткань.',
    category: 'пряная',
    notes: 'Глубокий рубиновый напиток с изысканным миндальным оттенком и теплым коричным шлейфом.'
  },
  {
    id: 'rcp-10',
    title: 'Лимончелла',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Лимоны свежие', qty: 3, unit: 'шт' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 28,
    yield_мл: 1420,
    loss_pct: 5,
    steps: '1. Тщательно вымыть лимоны и снять тонкий верхний слой цедры без белой части. 2. Отжать сок одного лимона. 3. Настаивать цедру на водке 10 дней. 4. Сварить сироп из воды и сахара, остудить, соединить с лимонным настоем и соком. 5. Дать отдохнуть 4 дня в холоде.',
    category: 'цитрусовая',
    notes: 'Шелковистый ликерный вкус с искрящимися эфирными цитрусовыми маслами.'
  },
  {
    id: 'rcp-11',
    title: 'Клюквенная',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Клюква лесная', qty: 900, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 16,
    target_abv: 29,
    yield_мл: 1370,
    loss_pct: 9,
    steps: '1. Клюкву перебрать, слегка размять или проколоть. 2. Приготовить сироп из воды и сахара. 3. Залить клюкву водкой и сиропом. 4. Настаивать 16 суток при периодическом перемешивании. 5. Двойная фильтрация до кристальной прозрачности.',
    category: 'ягодная',
    notes: 'Таежная пронзительная кислинка и чистый алый цвет. Подавать ледяной.'
  },
  {
    id: 'rcp-12',
    title: 'Черная смородина',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Черная смородина', qty: 600, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 30,
    yield_мл: 1390,
    loss_pct: 7,
    steps: '1. Смородину растолочь с сахаром до выделения сока. 2. Залить водкой и очищенной водой. 3. Настаивать 14 дней в темном прохладном месте. 4. Тщательно отфильтровать через плотный фильтр. 5. Дать отдохнуть 3 дня в стекле.',
    category: 'ягодная',
    notes: 'Любимый ягодный хит. Насыщенный танинный ягодный рубин.'
  },
  {
    id: 'rcp-13',
    title: 'Мандариновая',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Мандарины свежие', qty: 4.5, unit: 'шт' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 29,
    yield_мл: 1410,
    loss_pct: 6,
    steps: '1. Свежие мандарины тщательно вымыть щеткой, нарезать кружками вместе с кожурой. 2. Сварить сироп из сахара и воды. 3. Соединить мандарины, сироп и водку в банке. 4. Выдержать 14 дней в темноте. 5. Процедить через сито и фильтр.',
    category: 'цитрусовая',
    notes: 'Новогодний цитрусовый аромат с легкой благородной горчинкой эфирных масел.'
  },
  {
    id: 'rcp-14',
    title: 'Морозные яблочки',
    ingredients: [
      { name: 'Настойка «Яблоки на снегу»', qty: 1500, unit: 'мл' },
      { name: 'Лимоны свежие', qty: 2, unit: 'шт' },
    ],
    base_volume_мл: 1500,
    days: 10,
    target_abv: 28,
    yield_мл: 1470,
    loss_pct: 2,
    steps: '1. Снять тонкую цедру с 2 свежих лимонов без белой прослойки. 2. Залить цедру готовой настойкой «Яблоки на снегу». 3. Настаивать 10 дней в прохладном месте. 4. Профильтровать.',
    category: 'десертная',
    notes: 'Освежающий вкус моченых яблок с бодрящей морозной лимонной искрой.'
  },
  {
    id: 'rcp-15',
    title: 'Вяленые томаты',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Вяленые томаты', qty: 450, unit: 'г' },
      { name: 'Мёд липовый мордовский', qty: 60, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 31,
    yield_мл: 1380,
    loss_pct: 8,
    steps: '1. Вяленые томаты нарезать соломкой. 2. Растворить мед в воде. 3. Соединить томаты, медовую воду и водку. 4. Настаивать 14 суток в прохладе. 5. Профильтровать через кофейный фильтр.',
    category: 'гастрономическая',
    notes: 'Изысканный аперитив с ярким вкусом умами, вяленых помидоров и пряным теплом.'
  },
  {
    id: 'rcp-16',
    title: 'Бородинская',
    ingredients: [
      { name: 'Водка особая', qty: 1500, unit: 'мл' },
      { name: 'Сухари бородинские', qty: 150, unit: 'г' },
      { name: 'Кориандр зерно', qty: 5, unit: 'г' },
      { name: 'Тмин цельный', qty: 5, unit: 'г' },
      { name: 'Мёд липовый мордовский', qty: 60, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 7,
    target_abv: 38,
    yield_мл: 1410,
    loss_pct: 6,
    steps: '1. Бородинские сухари слегка подсушить в духовке до легкого аромата корочки (не сжечь!). 2. Кориандр и тмин слегка раздавить в ступке. 3. Мед размешать в 100 мл водки. 4. Залить сухари и пряности водкой. 5. Настаивать 7 суток, процедить и профильтровать.',
    category: 'гастрономическая',
    notes: 'Густой аромат свежеиспеченного ржаного бородинского каравая с тмином.'
  },
  {
    id: 'rcp-17',
    title: 'Барбарисовая',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Барбарис сушеный', qty: 250, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 16,
    target_abv: 29,
    yield_мл: 1410,
    loss_pct: 6,
    steps: '1. Сушеный барбарис промыть прохладной водой. 2. Сварить сироп из воды и сахара, остудить. 3. Залить барбарис водкой и сиропом. 4. Настаивать 16 дней в темном месте. 5. Профильтровать.',
    category: 'ягодная',
    notes: 'Яркая ностальгическая леденцовая кислинка барбариса и прозрачный рубиновый цвет.'
  },
  {
    id: 'rcp-18',
    title: 'Маракуйя',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Маракуйя (плоды/пюре)', qty: 600, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 12,
    target_abv: 28,
    yield_мл: 1390,
    loss_pct: 7,
    steps: '1. Мякоть маракуйи взбить с сиропом из сахара и воды. 2. Соединить с водкой в стеклянной емкости. 3. Выдержать 12 дней при легком встряхивании. 4. Двойная фильтрация через тонкое сито и марлю.',
    category: 'фруктовая',
    notes: 'Тропическая бомба: яркая экзотическая кислотность и сочный персиково-цитрусовый шлейф.'
  },
  {
    id: 'rcp-19',
    title: 'Черника',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Черника лесная', qty: 600, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 30,
    yield_мл: 1390,
    loss_pct: 7,
    steps: '1. Лесную чернику разморозить, перетереть с сахаром. 2. Добавить воду и водку. 3. Настаивать 14 дней в темном шкафу. 4. Тщательно отфильтровать.',
    category: 'ягодная',
    notes: 'Глубокий чернильно-фиолетовый цвет, бархатные лесные танины.'
  },
  {
    id: 'rcp-20',
    title: 'Красная смородина',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Красная смородина', qty: 600, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 29,
    yield_мл: 1400,
    loss_pct: 7,
    steps: '1. Ягоды красной смородины размять деревянным пестиком. 2. Растворить сахар в воде. 3. Залить смесь водкой. 4. Настаивать 14 дней. 5. Двойная фильтрация до кристального блеска.',
    category: 'ягодная',
    notes: 'Искрящаяся ягодная кислинка, нежная прозрачность и летняя легкость.'
  },
  {
    id: 'rcp-21',
    title: 'Гранат-малина на Джине',
    ingredients: [
      { name: 'Джин Бомбей Брамбл', qty: 1500, unit: 'мл' },
      { name: 'Гранат свежий', qty: 300, unit: 'г' },
      { name: 'Малина свежемороженая', qty: 300, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 16,
    target_abv: 32,
    yield_мл: 1440,
    loss_pct: 4,
    steps: '1. Гранат очистить, зерна слегка примять для отдачи сока. 2. Малину смешать с сахаром. 3. Залить все джином Bombay Bramble. 4. Выдержать 16 суток в темном месте. 5. Фильтрация через плотный фильтр.',
    category: 'ягодная',
    notes: 'Премиальный ботанический настой: глубокие гранатовые танины и малина на можжевеловом фоне.'
  },
  {
    id: 'rcp-22',
    title: 'Ананас-кокос',
    ingredients: [
      { name: 'Ананас свежий', qty: 900, unit: 'г' },
      { name: 'Кокосовая стружка', qty: 15, unit: 'г' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 28,
    yield_мл: 1380,
    loss_pct: 8,
    steps: '1. Свежий ананас очистить и нарезать мелкими кубиками. 2. Кокосовую стружку слегка прокалить на сухой сковороде 1 минуту. 3. Сварить сироп из сахара и воды. 4. Залить ананас и кокос водкой и сиропом. 5. Настаивать 14 дней, затем профильтровать.',
    category: 'фруктовая',
    notes: 'Крафтовая версия Пина Колады: сочный ананас со сливочно-кокосовым шлейфом.'
  },
  {
    id: 'rcp-23',
    title: 'Манго',
    ingredients: [
      { name: 'Манго спелое', qty: 600, unit: 'г' },
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Сахар-песок', qty: 300, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 12,
    target_abv: 28,
    yield_мл: 1400,
    loss_pct: 7,
    steps: '1. Спелое манго очистить от кожуры и косточки, нарезать кубиками. 2. Сварить сироп из сахара и воды. 3. Залить манго водкой и остывшим сиропом. 4. Настаивать 12 дней в темном месте. 5. Процедить через сито и кофейный фильтр.',
    category: 'фруктовая',
    notes: 'Густой медовый аромат спелого манго с шелковистой текстурой.'
  },
  {
    id: 'rcp-24',
    title: 'Вишня-миндаль',
    ingredients: [
      { name: 'Ликер Амаретто', qty: 1500, unit: 'мл' },
      { name: 'Вишня свежемороженая', qty: 450, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 14,
    target_abv: 26,
    yield_мл: 1460,
    loss_pct: 3,
    steps: '1. Вишню разморозить, сок отжать в емкость. 2. Залить ягоды благородным ликером Амаретто. 3. Выдержать 14 дней в темном шкафу. 4. Процедить через тонкое сито.',
    category: 'десертная',
    notes: 'Роскошный марципаново-вишневый дижестив. Подавать слегка охлажденным к кофе и десертам.'
  },
  {
    id: 'rcp-25',
    title: 'Борщ по-посопски',
    ingredients: [
      { name: 'Водка особая', qty: 1100, unit: 'мл' },
      { name: 'Вода очищенная', qty: 400, unit: 'мл' },
      { name: 'Свекла печеная', qty: 300, unit: 'г' },
      { name: 'Хрен свежий корень', qty: 50, unit: 'г' },
      { name: 'Чеснок свежий', qty: 30, unit: 'г' },
      { name: 'Укроп свежий', qty: 20, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 7,
    target_abv: 32,
    yield_мл: 1420,
    loss_pct: 5,
    steps: '1. Печеную свеклу натереть на крупной терке. 2. Корень хрена и чеснок нарезать тонкими слайсами. 3. Мелко нарубить свежий укроп. 4. Залить все водкой и водой. 5. Настаивать 7 суток в темноте при 16-18°C. 6. Процедить через марлю.',
    category: 'гастрономическая',
    notes: 'Легендарный саранский гастрономический шот с ароматом чеснока, свеклы и свежего укропа.'
  },
  {
    id: 'rcp-26',
    title: 'Черноплодка',
    ingredients: [
      { name: 'Настойка «Иней рябина»', qty: 1500, unit: 'мл' },
      { name: 'Рябина черноплодная (арония)', qty: 450, unit: 'г' },
    ],
    base_volume_мл: 1500,
    days: 21,
    target_abv: 31,
    yield_мл: 1440,
    loss_pct: 4,
    steps: '1. Черноплодную рябину перебрать, слегка подвялить или обдать кипятком для разрушения кожицы. 2. Залить настойкой «Иней рябина». 3. Настаивать 21 день в темном прохладном месте. 4. Отфильтровать.',
    category: 'ягодная',
    notes: 'Суровый танинный напиток глубокого темно-рубинового цвета с долгим вяжущим послевкусием.'
  }
];

export const INITIAL_INFUSIONS: Infusion[] = [
  { id: 'inf-01', name: 'Мордовская «Тишень»', recipe_id: 'rcp-01' },
  { id: 'inf-02', name: 'Джин на ежевике', recipe_id: 'rcp-02' },
  { id: 'inf-03', name: 'Хреновуха', recipe_id: 'rcp-03' },
  { id: 'inf-04', name: 'Медовуха', recipe_id: 'rcp-04' },
  { id: 'inf-05', name: 'Клубника на Джине', recipe_id: 'rcp-05' },
  { id: 'inf-06', name: 'Малиновый чай', recipe_id: 'rcp-06' },
  { id: 'inf-07', name: 'Имбирно-лимонная', recipe_id: 'rcp-07' },
  { id: 'inf-08', name: 'Облепиховая', recipe_id: 'rcp-08' },
  { id: 'inf-09', name: 'Пряная вишня', recipe_id: 'rcp-09' },
  { id: 'inf-10', name: 'Лимончелла', recipe_id: 'rcp-10' },
  { id: 'inf-11', name: 'Клюквенная', recipe_id: 'rcp-11' },
  { id: 'inf-12', name: 'Черная смородина', recipe_id: 'rcp-12' },
  { id: 'inf-13', name: 'Мандариновая', recipe_id: 'rcp-13' },
  { id: 'inf-14', name: 'Морозные яблочки', recipe_id: 'rcp-14' },
  { id: 'inf-15', name: 'Вяленые томаты', recipe_id: 'rcp-15' },
  { id: 'inf-16', name: 'Бородинская', recipe_id: 'rcp-16' },
  { id: 'inf-17', name: 'Барбарисовая', recipe_id: 'rcp-17' },
  { id: 'inf-18', name: 'Маракуйя', recipe_id: 'rcp-18' },
  { id: 'inf-19', name: 'Черника', recipe_id: 'rcp-19' },
  { id: 'inf-20', name: 'Красная смородина', recipe_id: 'rcp-20' },
  { id: 'inf-21', name: 'Гранат-малина на Джине', recipe_id: 'rcp-21' },
  { id: 'inf-22', name: 'Ананас-кокос', recipe_id: 'rcp-22' },
  { id: 'inf-23', name: 'Манго', recipe_id: 'rcp-23' },
  { id: 'inf-24', name: 'Вишня-миндаль', recipe_id: 'rcp-24' },
  { id: 'inf-25', name: 'Борщ по-посопски', recipe_id: 'rcp-25' },
  { id: 'inf-26', name: 'Черноплодка', recipe_id: 'rcp-26' },
];

export const INITIAL_SETS: InfusionSet[] = [
  {
    id: 'set-01',
    title: 'Богатырский мужской сет',
    composition: [
      { infusion_id: 'inf-03', qty_шт: 1 }, // Хреновуха
      { infusion_id: 'inf-15', qty_шт: 1 }, // Вяленые томаты
      { infusion_id: 'inf-16', qty_шт: 1 }, // Бородинская
    ],
    notes: 'Гастрономический сет под горячие сытные закуски и мясо'
  },
  {
    id: 'set-02',
    title: 'Ягодная поляна Мордовии',
    composition: [
      { infusion_id: 'inf-02', qty_шт: 1 }, // Джин на ежевике
      { infusion_id: 'inf-11', qty_шт: 1 }, // Клюквенная
      { infusion_id: 'inf-12', qty_шт: 1 }, // Черная смородина
    ],
    notes: 'Трио лесных и садовых ягод Мордовии'
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'bat-00',
    infusion_id: 'inf-01',
    venue_id: 'production-podvorie',
    volume_мл: 4350,
    start_date: '2026-10-20',
    ready_date: '2026-10-27',
    abv: 32,
    status: 'готово',
    rating: 5,
    notes: 'Партия №1: Мордовская Тишень'
  },
  {
    id: 'bat-01',
    infusion_id: 'inf-03',
    venue_id: 'production-podvorie',
    volume_мл: 4260,
    start_date: '2026-11-01',
    ready_date: '2026-11-06',
    abv: 38,
    status: 'готово',
    rating: 5,
    notes: 'Партия №15: Хреновуха отличной ядрености'
  },
  {
    id: 'bat-02',
    infusion_id: 'inf-02',
    venue_id: 'production-podvorie',
    volume_мл: 4140,
    start_date: '2026-10-25',
    ready_date: '2026-11-15',
    abv: 29,
    status: 'готово',
    rating: 5,
    notes: 'Партия №14: Джин на ежевике, насыщенный рубин'
  },
  {
    id: 'bat-03',
    infusion_id: 'inf-15',
    venue_id: 'production-podvorie',
    volume_мл: 4140,
    start_date: '2026-11-05',
    ready_date: '2026-11-19',
    abv: 31,
    status: 'настаивается',
    notes: 'Партия №16: Вяленые томаты, мацерация'
  },
  {
    id: 'bat-04',
    infusion_id: 'inf-03',
    venue_id: 'venue-samovar',
    volume_мл: 1420,
    start_date: '2026-11-07',
    ready_date: '2026-11-07',
    abv: 38,
    status: 'готово',
    notes: 'Принято с Подворья для бара'
  }
];

export const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: 'tr-01',
    transfer_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    from_venue_id: 'production-podvorie',
    to_venue_id: 'venue-samovar',
    item_type: 'infusion',
    infusion_id: 'inf-03',
    batch_id: 'bat-01',
    qty: 1420,
    unit: 'мл'
  }
];

export const INITIAL_NAME_MAPPING: NameMapping[] = [
  { id: 'nm-01', name_raw: 'тишень 40 гр п', infusion_id: 'inf-01' },
  { id: 'nm-02', name_raw: 'джин на ежевике 40 гр п', infusion_id: 'inf-02' },
  { id: 'nm-03', name_raw: 'настойка хреновуха 40 гр п', infusion_id: 'inf-03' },
  { id: 'nm-04', name_raw: 'медовуха 40 гр п', infusion_id: 'inf-04' },
  { id: 'nm-05', name_raw: 'клубника на джине 40 гр п', infusion_id: 'inf-05' },
  { id: 'nm-06', name_raw: 'настойка на вяленых томатах 40 гр п', infusion_id: 'inf-15' },
  { id: 'nm-07', name_raw: 'богатырский мужской сет п', set_id: 'set-01' }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sl-01',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'настойка',
    infusion_id: 'inf-03',
    name_raw: 'Настойка Хреновуха 40 гр П',
    portions_qty: 45,
    portion_size: 40,
    cost: 1620.00,
    revenue: 11250.00,
    source: 'import'
  },
  {
    id: 'sl-02',
    report_period: '2026-11-01',
    venue_id: 'venue-samovar',
    position_type: 'настойка',
    infusion_id: 'inf-02',
    name_raw: 'Джин на ежевике 40 гр П',
    portions_qty: 38,
    portion_size: 40,
    cost: 1444.00,
    revenue: 9500.00,
    source: 'import'
  }
];

export const INITIAL_OPERATIONS_LOG: OperationsLog[] = [
  {
    id: 'op-01',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    action: 'transfer_infusion',
    object: 'Хреновуха (1420 мл)',
    details: 'Перемещение с Подворье - Бар в Самовар',
    delta: {
      type: 'transfer_infusion',
      fromVenueId: 'production-podvorie',
      toVenueId: 'venue-samovar',
      infusionId: 'inf-03',
      volumeMl: 1420,
      deductions: [{ batchId: 'bat-01', volumeMl: 1420 }]
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
