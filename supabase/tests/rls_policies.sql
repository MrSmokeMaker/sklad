-- supabase/tests/rls_policies.sql: SQL-проверки RLS-политик ролей

begin;

-- 1. Создаем тестовых пользователей в auth.users
insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000001', 'owner_test@podvorie.ru'),
('00000000-0000-0000-0000-000000000002', 'staff_samovar@podvorie.ru'),
('00000000-0000-0000-0000-000000000003', 'viewer_test@podvorie.ru')
on conflict (id) do nothing;

-- 2. Создаем соответствующие профили с ролями
insert into public.profiles (id, email, full_name, role, venue_id) values
('00000000-0000-0000-0000-000000000001', 'owner_test@podvorie.ru', 'Владелец Тест', 'owner', 'production-podvorie'),
('00000000-0000-0000-0000-000000000002', 'staff_samovar@podvorie.ru', 'Бармен Тест', 'staff', 'venue-samovar'),
('00000000-0000-0000-0000-000000000003', 'viewer_test@podvorie.ru', 'Аудитор Тест', 'viewer', null)
on conflict (id) do update set role = excluded.role, venue_id = excluded.venue_id;

-- 3. Проверка: Staff может обновлять сырье СВОЕГО заведения
set local role authenticated;
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-000000000002';

update public.inventory
set quantity = quantity + 1
where venue_id = 'venue-samovar' and name = 'Сахар-песок';
-- Ожидается: 1 row affected

-- 4. Проверка: Staff НЕ может менять сырье ЧУЖОГО заведения (Подворье - Бар)
update public.inventory
set quantity = quantity + 1
where venue_id = 'production-podvorie' and name = 'Сахар-песок';
-- Ожидается: 0 rows affected (RLS filter блокирует запись)

-- 5. Проверка: Viewer НЕ может изменять сырье нигде
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-000000000003';

update public.inventory
set quantity = quantity + 10
where name = 'Сахар-песок';
-- Ожидается: 0 rows affected (RLS filter блокирует запись)

-- 6. Проверка: Owner может изменять сырье в ЛЮБОМ заведении
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-000000000001';

update public.inventory
set quantity = quantity + 2
where venue_id = 'production-podvorie' and name = 'Сахар-песок';
-- Ожидается: 1 row affected

rollback;
