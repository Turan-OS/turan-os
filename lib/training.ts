import type { Lesson, LessonProgress } from './supabase'

export type LessonState = 'locked' | 'available' | 'submitted' | 'approved' | 'rejected'

export interface LessonView {
  lesson: Lesson
  state: LessonState
  progress?: LessonProgress
}

export const STATE_LABEL: Record<LessonState, string> = {
  locked:    'Закрыт',
  available: 'Доступен',
  submitted: 'На проверке',
  approved:  'Принято',
  rejected:  'На доработку',
}

export const STATE_COLOR: Record<LessonState, string> = {
  locked:    '#aab2bd',
  available: '#00a35c',
  submitted: '#c98a00',
  approved:  '#00a35c',
  rejected:  '#d24a3d',
}

/**
 * Раскладка курса для конкретного ученика: первый день открыт всегда,
 * каждый следующий — только если предыдущий принят (approved).
 */
export function buildCourse(lessons: Lesson[], progress: LessonProgress[]): LessonView[] {
  const sorted = [...lessons].sort((a, b) => a.day_number - b.day_number)
  const byLesson = new Map(progress.map(p => [p.lesson_id, p]))
  const views: LessonView[] = []
  let prevApproved = true // первый урок открыт
  for (const lesson of sorted) {
    const p = byLesson.get(lesson.id)
    let state: LessonState
    if (!prevApproved) state = 'locked'
    else if (!p) state = 'available'
    else state = p.status
    views.push({ lesson, state, progress: p })
    prevApproved = p?.status === 'approved'
  }
  return views
}

/** Можно ли ученику открывать день (читать материал / сдавать домашку) */
export function isOpen(state: LessonState): boolean {
  return state !== 'locked'
}

/** Превращает ссылку YouTube/Vimeo в embed-URL для iframe. Иначе null. */
export function embedUrl(url?: string): string | null {
  if (!url) return null
  const u = url.trim()
  // YouTube
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  // Vimeo
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  return null
}
