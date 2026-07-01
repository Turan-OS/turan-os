import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase: SupabaseClient = url && key
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder') // fallback при сборке

export const isSupabaseConfigured = !!(url && key)

// ─── Серверный клиент для операций ЗАПИСИ в админке ───────────────
// Использует service-ключ, который обходит RLS. ТОЛЬКО на сервере
// (в server actions) — service-ключ не имеет префикса NEXT_PUBLIC,
// поэтому в браузер не попадает.
const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? ''

export const supabaseAdmin: SupabaseClient = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : supabase // fallback на обычный клиент, если ключ не задан

export interface News {
  id: number
  title: string
  date: string
  show_date?: boolean
  published?: boolean
  approved?: boolean
  published_at?: string | null
  description: string
  content?: string
  image_url?: string
  tags?: string[]
  created_at?: string
}

// Обучение менеджеров
export interface Material {
  type: 'link' | 'doc' | 'file'  // внешняя ссылка / документ на платформе / загруженный файл
  title: string
  url?: string    // для link и file
  slug?: string   // для doc (документ из Базы знаний)
}

export interface Lesson {
  id: number
  day_number: number
  title: string
  content?: string       // материал дня (Markdown)
  video_url?: string     // ссылка на видео
  homework?: string      // текст задания
  materials?: Material[] // карточки материалов дня
  published: boolean
  created_at?: string
}

// База знаний — документ (скрипт, регламент), открывается как страница
export interface Document {
  id: number
  slug: string
  title: string
  category?: string
  content?: string
  created_at?: string
}

export interface LessonProgress {
  id: number
  user_id: number
  lesson_id: number
  status: 'submitted' | 'approved' | 'rejected'
  submission?: string
  feedback?: string
  submitted_at?: string
  reviewed_at?: string
  reviewer_id?: number
  reviewer_name?: string
  audio_url?: string   // загруженная аудиозапись звонка
  created_at?: string
}

// Статусы заявки (колонки канбана) — см. lib/stages.ts
import type { StageKey } from './stages'
export type ApplicationStatus = StageKey

export interface Application {
  id: number
  name?: string
  contact?: string       // телефон / telegram
  is_owner?: string      // Да / Нет
  profit?: string        // Да / Нет
  sphere?: string
  instagram?: string
  motivation?: string
  status: ApplicationStatus
  amount?: number        // сумма сделки (сум)
  responsible?: string   // ответственный
  tags?: string[]        // теги
  source?: string        // источник (из базы контактов)
  turnover?: string      // оборот (из базы контактов)
  created_at?: string
}

export interface Contact {
  id: number
  name?: string
  phone?: string
  telegram?: string
  niche?: string
  status?: string
  turnover?: string
  comment?: string
  source?: string
  is_duplicate?: boolean
  application_id?: number | null
  responsible_id?: number | null
  created_at?: string
}

export interface User {
  id: number
  name: string
  email: string
  password_hash?: string
  role: 'admin' | 'administrator' | 'manager'
  status: 'pending' | 'active' | 'blocked'
  telegram_chat_id?: number | null
  telegram_link_code?: string | null
  created_at?: string
}

export interface ApplicationActivity {
  id: number
  application_id: number | null
  contact_id?: number | null
  type: string           // 'stage' | 'system' | 'call' | 'lead'
  text: string
  user_id?: number | null
  user_name?: string | null
  created_at?: string
}

export interface ApplicationComment {
  id: number
  application_id: number | null
  contact_id?: number | null
  body: string
  user_id?: number | null
  created_at?: string
}

export interface ApplicationTask {
  id: number
  application_id: number | null
  contact_id?: number | null
  title: string
  done: boolean
  result?: string | null
  due_date?: string | null
  user_id?: number | null
  created_at?: string
}
