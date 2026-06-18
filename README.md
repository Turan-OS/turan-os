# TURAN OS

Платформа: публичный сайт с разделом новостей/статей + админка (CRM, обучение, контент).
Стек: **Next.js 16 · Supabase · Tailwind 4 · MDX**.

Скопировано и переработано из проекта PRO Business Club: убраны разделы
мероприятий, гостей и резидентов; брендинг сброшен до нейтрального плейсхолдера
(акцент `#6366f1`) — реальный дизайн применяется после брендбука TURAN OS.

## Что внутри

**Публичный сайт** (`app/(site)`):
- Главная (`/`) — нейтральный лендинг (hero, о нас, заявка, контакты)
- Новости/статьи (`/news`, `/news/[slug]`)

**Админка** (`app/admin`, доступ по ролям admin / administrator / manager):
- Рабочий стол, Заявки (CRM-канбан со сделками/задачами), Задачи, База контактов
- Обучение (уроки, база знаний, экзамен, проверка ДЗ)
- Новости, Настройки, Пользователи

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # впиши ключи Supabase и секреты
npm run dev                  # http://localhost:3000
```

## Настройка с нуля (новый проект)

1. **Supabase**: создай новый проект на [supabase.com](https://supabase.com).
   Скопируй `Project URL`, `anon` и `service_role` ключи в `.env.local`.
2. **Схема БД**: открой Supabase → SQL Editor → выполни весь `supabase-schema.sql`.
3. **Первый админ**:
   ```bash
   node scripts/seed-admin.mjs <email> <пароль> "<Имя>"
   ```
4. (Опционально) **Уроки-демо**: `node scripts/seed-lessons.mjs`.
5. **GitHub**: создай новый репозиторий и запушь проект
   (`git init && git add . && git commit && git remote add origin … && git push`).

## Проверка типов и сборка

```bash
npx tsc --noEmit
npm run build
```

## Деплой

Docker + nginx на своём сервере — см. [DEPLOY.md](DEPLOY.md)
(перед деплоем впиши реальные домен и репозиторий).
