# PWA «Настойки» — Сеть ресторанов «Мордовское подворье»

Прогрессивное веб-приложение (PWA) для операционного складского учёта настоек, сырья и аналитики продаж для сети ресторанов:
- **«Подворье - Бар»** (Центральное производство)
- **«Самовар»** (Заведение)
- **«Мордовское подворье»** (Заведение)
- **«Ева»** (Заведение)

---

## 🎨 Паттерны дизайна (по канонам Mobbin)
- **Bottom Sheets вместо модальных окон**: удобное мобильное управление свайпом для быстрых операций прихода и списания (паттерн Revolut / Linear).
- **Segmented Control для фильтров**: мгновенное переключение заведений, категорий и периодов без скрытия контекста (паттерн Apple Fitness / iOS).
- **Pull-to-Refresh & Optimistic UI**: мгновенная обратная связь при перемещениях и списаниях без ожидания ответа сети.
- **Крупная типографика с плавным скрытием при скролле**: чёткая иерархия и фокус на числах остатков (паттерн Headspace).
- **Тонкие разделители и мягкие тени карточек**: воздух, скругления 16–24px, отсутствие визуального шума (паттерн Notion).

---

## 💎 Импорт дизайн-токенов в Figma (Tokens Studio)
Дизайн-токены приложения сохранены в файле `src/config/designTokens.json` по спецификации W3C Design Tokens Community Group.

### Инструкция по импорту в Figma:
1. Установите и откройте плагин **Tokens Studio for Figma** (ранее Figma Tokens).
2. Нажмите **Settings** -> **Add new sync provider** (или локальный импорт **Tools** -> **Load from file / paste JSON**).
3. Выберите файл `src/config/designTokens.json` или вставьте его содержимое.
4. Плагин автоматически создаст стили:
   - Цветовую палитру (Мордовский красный `#8B1A1A`, Янтарь `#E8A33D`, Крем `#F5EFE0`, фоны и статусы);
   - Радиусы скруглений (`16px`, `20px`, `24px`);
   - Тени (`soft`, `card`, `ambient`);
   - Типографику (гарнитура Manrope / Onest, шкалы заголовков).

---

## ⚙️ Настройка Supabase и SQL-миграция
1. Создайте проект в [Supabase](https://supabase.com).
2. Перейдите в раздел **SQL Editor**.
3. Скопируйте и выполните миграцию из файла `supabase/migrations/001_initial_schema.sql`.
4. В разделе **Authentication -> URL Configuration**:
   - Отключите **Confirm Email** (для мгновенной активации сотрудников без письма).
   - В поле **Redirect URLs** добавьте адрес приложения на GitHub Pages (например, `https://<ваш-логин>.github.io/<репозиторий>/`).
5. В разделе **Storage**:
   - Создан публичный бакет `attachments` (настраивается автоматически в SQL-миграции).

---

## ⚡ Supabase Edge Function (YandexGPT Lite)
1. Установите Supabase CLI: `npm install -g supabase`.
2. Авторизуйтесь: `supabase login`.
3. Привяжите проект: `supabase link --project-ref <your-project-ref>`.
4. Установите секреты для функции:
   ```bash
   supabase secrets set YANDEX_API_KEY="ваш_api_ключ"
   supabase secrets set YANDEX_FOLDER_ID="ваш_folder_id"
   ```
5. Разверните функцию:
   ```bash
   supabase functions deploy yandex-gpt
   ```

---

## 🚀 Деплой на GitHub Pages
Приложение настроено на автоматический деплой через GitHub Actions:
1. Создайте репозиторий на GitHub и отправьте код в ветку `main`.
2. В репозитории GitHub перейдите в **Settings -> Secrets and variables -> Actions** и добавьте:
   - `VITE_SUPABASE_URL`: URL вашего проекта Supabase;
   - `VITE_SUPABASE_ANON_KEY`: Анонимный ключ Supabase.
3. В **Settings -> Pages**:
   - **Source**: выберите `Deploy from a branch`;
   - **Branch**: выберите ветку `gh-pages` / `/ (root)`.
4. При каждом пуше в `main` workflow `.github/workflows/deploy.yml` автоматически соберет проект и развернет в `gh-pages`.
5. Хэш-роутинг (`createHashRouter`) обеспечивает 100% работоспособность всех прямых ссылок (включая `/invite/<token>`) без 404 на статических серверах Pages.

---

## 🧪 Запуск и тестирование локально
```bash
# Установка зависимостей
npm install

# Запуск в dev-режиме
npm run dev

# Запуск тестов (Vitest)
npm run test

# Сборка проекта
npm run build
```
