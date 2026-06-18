-- TURAN OS — полная схема базы данных
-- Запустить ОДИН РАЗ в новом Supabase-проекте → SQL Editor.
-- Содержит только используемые таблицы (без events/guests/residents).
-- Порядок важен из-за внешних ключей.

-- ─── ПОЛЬЗОВАТЕЛИ АДМИНКИ (роли) ─────────────────────────────────
create table if not exists users (
  id                 bigserial primary key,
  name               text not null,
  email              text not null unique,
  password_hash      text not null,
  role               text not null default 'manager',   -- admin | administrator | manager
  status             text not null default 'pending',   -- pending | active | blocked
  telegram_chat_id   bigint,
  telegram_link_code text,
  created_at         timestamptz default now()
);

-- ─── ЗАЯВКИ (CRM-канбан) ─────────────────────────────────────────
create table if not exists applications (
  id          bigserial primary key,
  name        text,
  contact     text,                       -- телефон / telegram
  is_owner    text,                       -- Да / Нет
  profit      text,                       -- Да / Нет
  sphere      text,
  instagram   text,
  motivation  text,
  status      text not null default 'new',-- new | contacted | meeting | ... | rejected (см. lib/stages.ts)
  amount      bigint not null default 0,  -- сумма сделки
  responsible text,                       -- ответственный
  tags        text[] default '{}',        -- теги
  source      text,                       -- источник (из базы контактов)
  turnover    text,                       -- оборот (из базы контактов)
  created_at  timestamptz default now()
);

-- ─── БАЗА КОНТАКТОВ (лиды) ───────────────────────────────────────
create table if not exists contacts (
  id               bigserial primary key,
  name             text,
  phone            text,
  telegram         text,
  niche            text,
  status           text,
  turnover         text,
  comment          text,
  source           text,                  -- источники через ;
  is_duplicate     boolean not null default false,
  application_id   bigint references applications(id) on delete set null,
  responsible_id   bigint references users(id) on delete set null,
  no_answer_total  int not null default 0,
  no_answer_streak int not null default 0,
  created_at       timestamptz default now()
);
create index if not exists contacts_phone_idx          on contacts (phone);
create index if not exists contacts_status_idx         on contacts (status);
create index if not exists contacts_application_id_idx on contacts (application_id);
create index if not exists contacts_responsible_idx    on contacts (responsible_id);

-- ─── ИСТОРИЯ СДЕЛКИ/КОНТАКТА ─────────────────────────────────────
-- application_id обнуляется при удалении сделки; contact_id каскадит при удалении контакта.
create table if not exists application_comments (
  id             bigserial primary key,
  application_id bigint references applications(id) on delete set null,
  contact_id     bigint references contacts(id)     on delete cascade,
  body           text not null,
  user_id        bigint,
  created_at     timestamptz default now()
);
create index if not exists comments_contact_idx on application_comments (contact_id, created_at);
create index if not exists comments_user_idx    on application_comments (user_id, created_at);

create table if not exists application_tasks (
  id             bigserial primary key,
  application_id bigint references applications(id) on delete set null,
  contact_id     bigint references contacts(id)     on delete cascade,
  title          text not null,
  done           boolean not null default false,
  result         text,
  due_date       timestamptz,
  user_id        bigint,
  created_at     timestamptz default now()
);
create index if not exists tasks_contact_idx on application_tasks (contact_id, created_at);
create index if not exists tasks_user_idx    on application_tasks (user_id, created_at);

create table if not exists application_activity (
  id             bigserial primary key,
  application_id bigint references applications(id) on delete set null,
  contact_id     bigint references contacts(id)     on delete cascade,
  type           text not null default 'system',    -- 'stage' | 'system' | 'call' | 'lead'
  text           text not null,
  user_id        bigint,
  user_name      text,
  created_at     timestamptz default now()
);
create index if not exists activity_contact_idx on application_activity (contact_id, created_at);
create index if not exists activity_user_idx    on application_activity (user_id, created_at);

-- ─── ОБУЧЕНИЕ ────────────────────────────────────────────────────
create table if not exists lessons (
  id          bigserial primary key,
  day_number  int  not null,
  title       text not null,
  content     text,
  video_url   text,
  homework    text,
  materials   jsonb not null default '[]'::jsonb,
  published   boolean not null default true,
  created_at  timestamptz default now()
);

create table if not exists lesson_progress (
  id            bigserial primary key,
  user_id       bigint not null references users(id)   on delete cascade,
  lesson_id     bigint not null references lessons(id) on delete cascade,
  status        text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  submission    text,
  feedback      text,
  audio_url     text,
  submitted_at  timestamptz default now(),
  reviewed_at   timestamptz,
  reviewer_id   bigint,
  reviewer_name text,
  created_at    timestamptz default now(),
  unique (user_id, lesson_id)
);
create index if not exists idx_lesson_progress_user   on lesson_progress(user_id);
create index if not exists idx_lesson_progress_lesson on lesson_progress(lesson_id);

-- База знаний — документы (скрипты, регламенты), открываются как страницы
create table if not exists documents (
  id         bigserial primary key,
  slug       text unique not null,
  title      text not null,
  category   text,
  content    text,
  created_at timestamptz default now()
);

-- ─── НОВОСТИ / СТАТЬИ (единственный публичный раздел) ────────────
create table if not exists news (
  id          bigserial primary key,
  title       text not null,
  date        date not null,
  description text not null default '',
  content     text,
  image_url   text,
  published   boolean not null default true,
  show_date   boolean not null default true,
  tags        text[],
  created_at  timestamptz default now()
);

-- ─── НАСТРОЙКИ (ключ-значение) ───────────────────────────────────
create table if not exists settings (
  key   text primary key,
  value text
);
insert into settings (key, value) values ('daily_call_goal', '30')
  on conflict (key) do nothing;

-- ─── RLS ─────────────────────────────────────────────────────────
-- Всё закрыто (доступ через service-ключ), публичное чтение — только новости.
alter table users                enable row level security;
alter table applications         enable row level security;
alter table contacts             enable row level security;
alter table application_comments enable row level security;
alter table application_tasks    enable row level security;
alter table application_activity enable row level security;
alter table lessons              enable row level security;
alter table lesson_progress      enable row level security;
alter table documents            enable row level security;
alter table news                 enable row level security;
alter table settings             enable row level security;

create policy "Public read news" on news for select using (published is not false);

-- ─── STORAGE ─────────────────────────────────────────────────────
-- Bucket для загрузок (картинки новостей, аудио-домашки). Public read.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;

-- После схемы создай первого админа:  node scripts/seed-admin.mjs
