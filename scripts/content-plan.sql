-- Контент-план: посты с превью, статусами и утверждением
create table if not exists content_posts (
  id              serial primary key,
  title           text not null default '',   -- тема
  description      text default '',            -- описание/идея
  caption         text default '',             -- подпись для публикации
  type            text default 'carousel',     -- carousel | post | reel | story | text
  status          text default 'idea',         -- idea | draft | review | approved | scheduled | published
  publish_date    date,                        -- дата публикации
  media           jsonb default '[]'::jsonb,   -- массив URL картинок (слайды карусели)
  platform        text default 'instagram',    -- площадка
  sort            int default 0,
  created_by      int,
  created_by_name text,
  approved_by     int,
  approved_by_name text,
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists content_posts_status_idx on content_posts(status);
create index if not exists content_posts_date_idx   on content_posts(publish_date);

-- обновить кэш схемы PostgREST (безопасно и для Supabase)
notify pgrst, 'reload schema';
