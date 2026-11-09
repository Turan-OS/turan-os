// Контент-план — типы, статусы и справочники (общие для сервера и клиента)

export type ContentType = 'carousel' | 'post' | 'reel' | 'story' | 'text'
export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published'

export interface ContentPost {
  id: number
  title: string
  description: string
  caption: string
  type: ContentType
  status: ContentStatus
  publish_date: string | null
  media: string[]
  platform: string
  sort: number
  created_by?: number | null
  created_by_name?: string | null
  approved_by?: number | null
  approved_by_name?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}

export const TYPES: { key: ContentType; label: string; icon: string }[] = [
  { key: 'carousel', label: 'Карусель', icon: '🖼' },
  { key: 'post',     label: 'Пост',     icon: '📷' },
  { key: 'reel',     label: 'Reels',    icon: '🎬' },
  { key: 'story',    label: 'Stories',  icon: '⭕️' },
  { key: 'text',     label: 'Текст',    icon: '📝' },
]
export const TYPE_LABEL: Record<ContentType, string> = Object.fromEntries(TYPES.map(t => [t.key, t.label])) as Record<ContentType, string>

// Воронка статусов (слева направо). approved = утверждён собственником.
export const STATUSES: { key: ContentStatus; label: string; color: string; bg: string }[] = [
  { key: 'idea',      label: 'Идея',          color: '#8a929c', bg: '#eef0f3' },
  { key: 'draft',     label: 'Черновик',      color: '#b87613', bg: 'rgba(240,160,32,0.12)' },
  { key: 'review',    label: 'На утверждении', color: '#2b6cb0', bg: 'rgba(43,108,176,0.1)' },
  { key: 'approved',  label: 'Утверждён',     color: '#00955a', bg: 'rgba(0,196,111,0.12)' },
  { key: 'scheduled', label: 'Запланирован',  color: '#7a5bd5', bg: 'rgba(122,91,213,0.12)' },
  { key: 'published', label: 'Опубликован',   color: '#127a98', bg: 'rgba(30,170,209,0.12)' },
]
export const STATUS_META: Record<ContentStatus, { label: string; color: string; bg: string }> =
  Object.fromEntries(STATUSES.map(s => [s.key, { label: s.label, color: s.color, bg: s.bg }])) as Record<ContentStatus, { label: string; color: string; bg: string }>

export function normalizeMedia(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string' && !!x)
  return []
}

export function isVideo(url: string): boolean {
  return /\.(mp4|mov|webm|m4v|ogv|ogg)(\?|#|$)/i.test(url)
}
