-- 001_initial_schema.sql: Полная схема БД приложения «Настойки»
-- Включает таблицы, индексы, RLS-политики, триггеры профилей и сид данных

-- Расширения
create extension if not exists "uuid-ossp";

-- 1. Таблица venues (Заведения сети)
create table if not exists public.venues (
    id text primary key,
    name text not null,
    kind text not null check (kind in ('production', 'venue')),
    is_active boolean default true not null,
    created_at timestamptz default now() not null
);

-- 2. Таблица profiles (Профили пользователей)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text default '' not null,
    role text not null check (role in ('owner', 'staff', 'viewer')),
    venue_id text references public.venues(id) on delete set null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 3. Таблица invites (Одноразовые приглашения)
create table if not exists public.invites (
    id uuid primary key default uuid_generate_v4(),
    token uuid default uuid_generate_v4() not null unique,
    role text not null check (role in ('owner', 'staff', 'viewer')),
    venue_id text references public.venues(id) on delete set null,
    created_by uuid references public.profiles(id) on delete set null,
    expires_at timestamptz not null default (now() + interval '7 days'),
    used_by uuid references public.profiles(id) on delete set null,
    used_at timestamptz,
    created_at timestamptz default now() not null
);

-- 4. Таблица inventory (Склад сырья и материалов)
create table if not exists public.inventory (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    type text default 'сырьё' not null,
    venue_id text not null references public.venues(id) on delete cascade,
    quantity numeric not null default 0,
    unit text not null check (unit in ('г', 'мл', 'шт', 'л', 'кг')),
    min_stock numeric default 0 not null,
    expiry_date date,
    updated_at timestamptz default now() not null,
    updated_by uuid references public.profiles(id) on delete set null
);

-- 5. Таблица recipes (Технологические карты настоек)
create table if not exists public.recipes (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    ingredients jsonb not null default '[]'::jsonb, -- [{name: string, qty: number, unit: string}]
    base_volume_мл numeric default 1000 not null,  -- База расчета (все рецепты на 1 л)
    days integer default 14 not null,
    target_abv numeric default 40 not null,
    yield_мл numeric default 900 not null,          -- Выход после отжима и фильтрации
    loss_pct numeric default 10 not null,           -- Процент технологических потерь
    steps text default '' not null,
    category text default 'ягодная' not null check (category in ('ягодная', 'фруктовая', 'пряная', 'наливка', 'другое')),
    notes text default '',
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now() not null
);

-- 6. Таблица infusions (Реестр настоек)
create table if not exists public.infusions (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    recipe_id uuid references public.recipes(id) on delete set null,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now() not null
);

-- 7. Таблица sets (Сеты настоек для меню)
create table if not exists public.sets (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    composition jsonb default '[]'::jsonb, -- [{infusion_id: uuid, qty_шт: number}]
    notes text default '',
    created_at timestamptz default now() not null
);

-- 8. Таблица batches (Партии настоек)
create table if not exists public.batches (
    id uuid primary key default uuid_generate_v4(),
    infusion_id uuid not null references public.infusions(id) on delete cascade,
    venue_id text not null references public.venues(id) on delete cascade,
    volume_мл numeric not null check (volume_мл >= 0),
    start_date date default current_date not null,
    ready_date date not null,
    abv numeric default 40 not null,
    status text not null check (status in ('настаивается', 'готово', 'разлито', 'архив')),
    rating integer check (rating between 1 and 5),
    notes text default '',
    photo_url text,
    created_at timestamptz default now() not null
);

-- 9. Таблица transfers (Журнал перемещений)
create table if not exists public.transfers (
    id uuid primary key default uuid_generate_v4(),
    transfer_date timestamptz default now() not null,
    from_venue_id text not null references public.venues(id),
    to_venue_id text not null references public.venues(id),
    item_type text not null check (item_type in ('raw', 'infusion')),
    inventory_id uuid references public.inventory(id) on delete set null,
    infusion_id uuid references public.infusions(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    qty numeric not null check (qty > 0),
    unit text not null,
    created_by uuid references public.profiles(id) on delete set null,
    photo_url text
);

-- 10. Таблица sales (Импорт продаж из Excel для фин. аналитики)
create table if not exists public.sales (
    id uuid primary key default uuid_generate_v4(),
    report_period date not null, -- Первое число отчетного месяца
    venue_id text not null references public.venues(id),
    position_type text not null check (position_type in ('настойка', 'сет')),
    infusion_id uuid references public.infusions(id) on delete set null,
    set_id uuid references public.sets(id) on delete set null,
    name_raw text not null,
    portions_qty numeric not null default 0,
    portion_size numeric default 40 not null, -- в мл/гр
    cost numeric not null default 0,          -- Себестоимость из отчета
    revenue numeric not null default 0,       -- Выручка со скидкой из отчета
    source text default 'import' not null,
    created_at timestamptz default now() not null,
    constraint unique_sales_position unique (report_period, venue_id, name_raw)
);

-- 11. Таблица name_mapping (Сопоставление названий из отчетов)
create table if not exists public.name_mapping (
    id uuid primary key default uuid_generate_v4(),
    name_raw text not null unique,
    infusion_id uuid references public.infusions(id) on delete cascade,
    set_id uuid references public.sets(id) on delete cascade
);

-- 12. Таблица operations_log (Журнал операций для отката)
create table if not exists public.operations_log (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default now() not null,
    user_id uuid references public.profiles(id) on delete set null,
    action text not null,
    object text not null,
    delta jsonb not null default '{}'::jsonb,
    details text default '' not null,
    photo_url text
);

-- 13. Таблица unit_conversions (Коэффициенты перевода)
create table if not exists public.unit_conversions (
    id uuid primary key default uuid_generate_v4(),
    from_unit text not null,
    to_unit text not null,
    factor numeric not null,
    applies_to text default 'all' not null
);

-- Индексы для ускорения выборок
create index if not exists idx_inventory_venue on public.inventory(venue_id);
create index if not exists idx_batches_venue_status on public.batches(venue_id, status);
create index if not exists idx_batches_ready_date on public.batches(ready_date);
create index if not exists idx_transfers_dates on public.transfers(transfer_date desc);
create index if not exists idx_sales_period_venue on public.sales(report_period, venue_id);
create index if not exists idx_name_mapping_raw on public.name_mapping(name_raw);

-- RLS (Row Level Security)
alter table public.venues enable row level security;
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.inventory enable row level security;
alter table public.recipes enable row level security;
alter table public.infusions enable row level security;
alter table public.sets enable row level security;
alter table public.batches enable row level security;
alter table public.transfers enable row level security;
alter table public.sales enable row level security;
alter table public.name_mapping enable row level security;
alter table public.operations_log enable row level security;
alter table public.unit_conversions enable row level security;

-- Хелпер: получение роли текущего пользователя
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Хелпер: получение venue_id текущего пользователя
create or replace function public.current_user_venue()
returns text language sql stable security definer as $$
  select venue_id from public.profiles where id = auth.uid();
$$;

-- Политики для Venues (Чтение для всех авторизованных, запись только owner)
create policy "Venues read" on public.venues for select to authenticated using (true);
create policy "Venues write owner" on public.venues for all to authenticated using (public.current_user_role() = 'owner');

-- Политики для Profiles
-- Owner видит всех; staff/viewer видят себя и коллег своего заведения
create policy "Profiles select" on public.profiles for select to authenticated using (
  public.current_user_role() = 'owner' or id = auth.uid() or venue_id = public.current_user_venue()
);
create policy "Profiles update owner" on public.profiles for update to authenticated using (
  public.current_user_role() = 'owner' or id = auth.uid()
);

-- Политики для Invites (Только Owner управляет, регистрация читает токен)
create policy "Invites read owner" on public.invites for select to authenticated using (public.current_user_role() = 'owner');
create policy "Invites write owner" on public.invites for all to authenticated using (public.current_user_role() = 'owner');
create policy "Invites token lookup anon" on public.invites for select to anon using (used_at is null and expires_at > now());

-- Политики для Inventory
-- Чтение доступно всем авторизованным (viewer/staff/owner)
create policy "Inventory select" on public.inventory for select to authenticated using (true);
-- Запись: owner везде, staff в своем заведении
create policy "Inventory write" on public.inventory for all to authenticated using (
  public.current_user_role() = 'owner' or
  (public.current_user_role() = 'staff' and venue_id = public.current_user_venue())
);

-- Политики для Recipes / Infusions / Sets
create policy "Recipes select" on public.recipes for select to authenticated using (true);
create policy "Recipes write" on public.recipes for all to authenticated using (public.current_user_role() in ('owner', 'staff'));

create policy "Infusions select" on public.infusions for select to authenticated using (true);
create policy "Infusions write" on public.infusions for all to authenticated using (public.current_user_role() in ('owner', 'staff'));

create policy "Sets select" on public.sets for select to authenticated using (true);
create policy "Sets write" on public.sets for all to authenticated using (public.current_user_role() in ('owner', 'staff'));

-- Политики для Batches
create policy "Batches select" on public.batches for select to authenticated using (true);
create policy "Batches write" on public.batches for all to authenticated using (
  public.current_user_role() = 'owner' or
  (public.current_user_role() = 'staff' and venue_id = public.current_user_venue())
);

-- Политики для Transfers
create policy "Transfers select" on public.transfers for select to authenticated using (true);
create policy "Transfers write" on public.transfers for insert to authenticated with check (
  public.current_user_role() in ('owner', 'staff')
);

-- Политики для Sales (Аналитика: чтение owner и viewer; запись только owner при импорте)
create policy "Sales select" on public.sales for select to authenticated using (
  public.current_user_role() in ('owner', 'viewer')
);
create policy "Sales write owner" on public.sales for all to authenticated using (
  public.current_user_role() = 'owner'
);

-- Политики для Name Mapping
create policy "Name mapping select" on public.name_mapping for select to authenticated using (true);
create policy "Name mapping write" on public.name_mapping for all to authenticated using (public.current_user_role() in ('owner', 'staff'));

-- Политики для Operations Log
create policy "Operations log select" on public.operations_log for select to authenticated using (true);
create policy "Operations log insert" on public.operations_log for insert to authenticated with check (true);
create policy "Operations log delete" on public.operations_log for delete to authenticated using (public.current_user_role() in ('owner', 'staff'));

-- Триггер автоматического создания профиля при регистрации через Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  user_count integer;
  inv_record record;
  assigned_role text := 'viewer';
  assigned_venue text := null;
  invite_token_raw text;
begin
  select count(*) into user_count from public.profiles;

  -- Первый пользователь системы всегда становится owner
  if user_count = 0 then
    assigned_role := 'owner';
    assigned_venue := 'production-podvorie';
  else
    -- Проверка наличия токена приглашения в metadata пользователя
    invite_token_raw := new.raw_user_meta_data->>'invite_token';
    if invite_token_raw is not null then
      select * into inv_record from public.invites
      where token = invite_token_raw::uuid and used_at is null and expires_at > now();

      if inv_record.id is not null then
        assigned_role := inv_record.role;
        assigned_venue := inv_record.venue_id;

        update public.invites
        set used_by = new.id, used_at = now()
        where id = inv_record.id;
      end if;
    end if;
  end if;

  insert into public.profiles (id, email, full_name, role, venue_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role,
    assigned_venue
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- СИДИРОВАНИЕ ДАННЫХ
-- 1. Заведения
insert into public.venues (id, name, kind, is_active) values
('production-podvorie', 'Подворье - Бар', 'production', true),
('venue-samovar', 'Самовар', 'venue', true),
('venue-podvorie', 'Мордовское подворье', 'venue', true),
('venue-eva', 'Ева', 'venue', true)
on conflict (id) do nothing;

-- 2. Единицы конвертации
insert into public.unit_conversions (from_unit, to_unit, factor, applies_to) values
('кг', 'г', 1000, 'all'),
('г', 'кг', 0.001, 'all'),
('л', 'мл', 1000, 'all'),
('мл', 'л', 0.001, 'all'),
('порция', 'мл', 40, 'infusion'),
('порция', 'г', 40, 'infusion')
on conflict do nothing;

-- 3. Начальное сырьё на центральном складе «Подворье - Бар»
insert into public.inventory (name, type, venue_id, quantity, unit, min_stock, expiry_date) values
('Спирт люкс 96%', 'спирт', 'production-podvorie', 50, 'л', 10, '2028-12-31'),
('Водка особая', 'алкоголь', 'production-podvorie', 30, 'л', 10, '2027-12-31'),
('Вишня свежемороженая', 'ягоды', 'production-podvorie', 25, 'кг', 5, '2026-10-01'),
('Черная смородина', 'ягоды', 'production-podvorie', 18, 'кг', 5, '2026-10-01'),
('Клюква лесная', 'ягоды', 'production-podvorie', 20, 'кг', 5, '2026-10-01'),
('Брусника таежная', 'ягоды', 'production-podvorie', 15, 'кг', 4, '2026-10-01'),
('Рябина красная', 'ягоды', 'production-podvorie', 12, 'кг', 3, '2026-10-01'),
('Яблоки сушеные', 'фрукты', 'production-podvorie', 10, 'кг', 2, '2026-12-31'),
('Мёд липовый мордовский', 'мёд', 'production-podvorie', 15, 'кг', 3, '2027-06-01'),
('Сахар-песок', 'бакалея', 'production-podvorie', 40, 'кг', 10, '2028-01-01'),
('Вяленые томаты', 'специи/овощи', 'production-podvorie', 8, 'кг', 2, '2026-08-01'),
('Хрен свежий корень', 'коренья', 'production-podvorie', 6, 'кг', 1.5, '2026-06-01'),
('Гвоздика целая', 'пряности', 'production-podvorie', 2, 'кг', 0.5, '2027-12-31'),
('Дубовая щепа сильного обжига', 'древесина', 'production-podvorie', 5, 'кг', 1, '2029-12-31')
on conflict do nothing;

-- Сырье на заведениях сети (начальные остатки)
insert into public.inventory (name, type, venue_id, quantity, unit, min_stock, expiry_date) values
('Сахар-песок', 'бакалея', 'venue-samovar', 5, 'кг', 2, '2028-01-01'),
('Мёд липовый мордовский', 'мёд', 'venue-samovar', 2, 'кг', 1, '2027-06-01'),
('Сахар-песок', 'бакалея', 'venue-podvorie', 6, 'кг', 2, '2028-01-01'),
('Мёд липовый мордовский', 'мёд', 'venue-podvorie', 3, 'кг', 1, '2027-06-01'),
('Сахар-песок', 'бакалея', 'venue-eva', 4, 'кг', 2, '2028-01-01')
on conflict do nothing;

-- 4. Рецепты настоек (все рассчитаны на 1 литр базы)
insert into public.recipes (id, title, ingredients, base_volume_мл, days, target_abv, yield_мл, loss_pct, steps, category, notes) values
('a0000000-0000-0000-0000-000000000001', 'Настойка на вяленых томатах', '[{"name": "Спирт люкс 96%", "qty": 450, "unit": "мл"}, {"name": "Вяленые томаты", "qty": 200, "unit": "г"}, {"name": "Гвоздика целая", "qty": 3, "unit": "г"}]'::jsonb, 1000, 10, 38, 920, 8, '1. Нарезать томаты. 2. Залить спиртом с водой до 40%. 3. Настаивать 10 дней в темном месте. 4. Профильтровать.', 'пряная', 'Фирменная гастрономическая настойка'),
('a0000000-0000-0000-0000-000000000002', 'Настойка на черной смородине', '[{"name": "Спирт люкс 96%", "qty": 420, "unit": "мл"}, {"name": "Черная смородина", "qty": 350, "unit": "г"}, {"name": "Сахар-песок", "qty": 80, "unit": "г"}]'::jsonb, 1000, 14, 35, 900, 10, '1. Растолочь ягоды с сахаром. 2. Залить спиртовой основой. 3. Выдержать 14 дней. 4. Двойная фильтрация.', 'ягодная', 'Классика, хит продаж'),
('a0000000-0000-0000-0000-000000000003', 'Настойка Хреновуха', '[{"name": "Водка особая", "qty": 950, "unit": "мл"}, {"name": "Хрен свежий корень", "qty": 80, "unit": "г"}, {"name": "Мёд липовый мордовский", "qty": 50, "unit": "г"}, {"name": "Гвоздика целая", "qty": 2, "unit": "г"}]'::jsonb, 1000, 5, 38, 950, 5, '1. Натереть хрен соломкой. 2. Растворить мед в водке. 3. Настаивать строго 5 суток, не передерживать. 4. Слить через марлю.', 'пряная', 'Подавать ледяной к мясу'),
('a0000000-0000-0000-0000-000000000004', 'Настойка на клюкве', '[{"name": "Спирт люкс 96%", "qty": 430, "unit": "мл"}, {"name": "Клюква лесная", "qty": 350, "unit": "г"}, {"name": "Сахар-песок", "qty": 100, "unit": "г"}]'::jsonb, 1000, 14, 34, 910, 9, '1. Подмороженную клюкву проколоть или размять. 2. Соединить со спиртом и сахаром. 3. 14 дней созревания.', 'ягодная', 'Яркий рубиновый цвет'),
('a0000000-0000-0000-0000-000000000005', 'Настойка Мордовская', '[{"name": "Спирт люкс 96%", "qty": 450, "unit": "мл"}, {"name": "Рябина красная", "qty": 200, "unit": "г"}, {"name": "Яблоки сушеные", "qty": 100, "unit": "г"}, {"name": "Мёд липовый мордовский", "qty": 70, "unit": "г"}, {"name": "Дубовая щепа сильного обжига", "qty": 10, "unit": "г"}]'::jsonb, 1000, 21, 40, 880, 12, '1. Щепу ошпарить. 2. Смешать рябину, яблоки и мед со спиртовой основой. 3. Выдержка 21 день. 4. Фильтрация и отдых 3 дня.', 'наливка', 'Аутентичный рецепт на местной рябине')
on conflict (id) do nothing;

-- 5. Инфузии
insert into public.infusions (id, name, recipe_id) values
('b0000000-0000-0000-0000-000000000001', 'Настойка на вяленых томатах', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'Настойка на черной смородине', 'a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000003', 'Настойка Хреновуха', 'a0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000004', 'Настойка на клюкве', 'a0000000-0000-0000-0000-000000000004'),
('b0000000-0000-0000-0000-000000000005', 'Настойка Мордовская', 'a0000000-0000-0000-0000-000000000005'),
('b0000000-0000-0000-0000-000000000006', 'Настойка Сливочная халва', null)
on conflict (id) do nothing;

-- 6. Сеты
insert into public.sets (id, title, composition, notes) values
('c0000000-0000-0000-0000-000000000008', 'Сет №8 Адмирала Ушакова', '[{"infusion_id": "b0000000-0000-0000-0000-000000000001", "qty_шт": 1}, {"infusion_id": "b0000000-0000-0000-0000-000000000003", "qty_шт": 1}, {"infusion_id": "b0000000-0000-0000-0000-000000000005", "qty_шт": 1}]'::jsonb, 'Флагманский мужской сет из трех настоек по 40 мл')
on conflict (id) do nothing;

-- 7. Готовые партии настоек на центральном баре
insert into public.batches (id, infusion_id, venue_id, volume_мл, start_date, ready_date, abv, status, rating, notes) values
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'production-podvorie', 4600, '2026-10-01', '2026-10-11', 38, 'готово', 5, 'Партия №12: отличный баланс специй и томатов'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'production-podvorie', 5400, '2026-10-05', '2026-10-19', 35, 'готово', 4, 'Партия №14: ягода сладкая, фильтрация чистая'),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'production-podvorie', 3800, '2026-11-01', '2026-11-06', 38, 'готово', 5, 'Партия №15: хрен свежий, ядрёная'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'production-podvorie', 7000, '2026-11-05', '2026-11-26', 40, 'настаивается', null, 'Партия №16: настаивание на рябине и щепе')
on conflict (id) do nothing;

-- 8. Сид начального сопоставления названий (name_mapping)
insert into public.name_mapping (name_raw, infusion_id, set_id) values
('настойка на вяленых томатах 40 гр п', 'b0000000-0000-0000-0000-000000000001', null),
('настойка на черной смородине 40 гр п', 'b0000000-0000-0000-0000-000000000002', null),
('настойка хреновуха 40 гр п', 'b0000000-0000-0000-0000-000000000003', null),
('настойка на клюкве 40 гр п', 'b0000000-0000-0000-0000-000000000004', null),
('настойка мордовская 40 гр п', 'b0000000-0000-0000-0000-000000000005', null),
('сливочная халва 40 гр настойка п', 'b0000000-0000-0000-0000-000000000006', null),
('сет №8 адмирала ушакова п', null, 'c0000000-0000-0000-0000-000000000008')
on conflict (name_raw) do nothing;

-- 9. Тестовые продажи за прошлый месяц для аналитики
insert into public.sales (report_period, venue_id, position_type, infusion_id, set_id, name_raw, portions_qty, portion_size, cost, revenue, source) values
('2026-11-01', 'venue-samovar', 'настойка', 'b0000000-0000-0000-0000-000000000001', null, 'Настойка на вяленых томатах 40 гр П', 34.000, 40, 1306.95, 8500.00, 'import'),
('2026-11-01', 'venue-samovar', 'настойка', 'b0000000-0000-0000-0000-000000000002', null, 'Настойка на черной смородине 40 гр П', 48.000, 40, 1728.00, 12000.00, 'import'),
('2026-11-01', 'venue-samovar', 'настойка', 'b0000000-0000-0000-0000-000000000003', null, 'Настойка Хреновуха 40 гр П', 52.000, 40, 1872.00, 13000.00, 'import'),
('2026-11-01', 'venue-samovar', 'сет', null, 'c0000000-0000-0000-0000-000000000008', 'Сет №8 Адмирала Ушакова П', 18.000, 120, 2160.00, 10800.00, 'import'),
('2026-11-01', 'venue-podvorie', 'настойка', 'b0000000-0000-0000-0000-000000000002', null, 'Настойка на черной смородине 40 гр П', 62.000, 40, 2232.00, 15500.00, 'import'),
('2026-11-01', 'venue-podvorie', 'настойка', 'b0000000-0000-0000-0000-000000000005', null, 'Настойка Мордовская 40 гр П', 45.000, 40, 2025.00, 13500.00, 'import'),
('2026-11-01', 'venue-eva', 'настойка', 'b0000000-0000-0000-0000-000000000004', null, 'Настойка на клюкве 40 гр П', 30.000, 40, 1080.00, 7500.00, 'import')
on conflict do nothing;
