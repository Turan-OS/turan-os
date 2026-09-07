// Этапы воронки найма (канбан кандидатов). Единый набор по умолчанию.
export type HrStageKey = 'new' | 'screening' | 'interview' | 'test' | 'offer' | 'hired' | 'rejected'

export interface HrStage { key: HrStageKey; title: string; color: string }

export const HR_STAGES: HrStage[] = [
  { key: 'new',       title: 'Новый',     color: '#5b9bd5' },
  { key: 'screening', title: 'Скрининг',  color: '#c9bf3d' },
  { key: 'interview', title: 'Интервью',  color: '#f5a623' },
  { key: 'test',      title: 'Тестовое',  color: '#9b8cd0' },
  { key: 'offer',     title: 'Оффер',     color: '#1EAAD1' },
  { key: 'hired',     title: 'Принят',    color: '#0a9a55' },
  { key: 'rejected',  title: 'Отказ',     color: '#aab2bd' },
]

export const HR_STAGE_TITLE: Record<string, string> = Object.fromEntries(HR_STAGES.map(s => [s.key, s.title]))
export const HR_STAGE_COLOR: Record<string, string> = Object.fromEntries(HR_STAGES.map(s => [s.key, s.color]))
export const HR_FIRST_STAGE: HrStageKey = 'new'

// Типы вопросов в конструкторе форм
export type HrQuestionType = 'text' | 'textarea' | 'phone' | 'email' | 'select' | 'number'
export interface HrQuestion {
  key: string          // стабильный ключ (для answers)
  label: string        // текст вопроса
  type: HrQuestionType
  required?: boolean
  options?: string[]   // для select
}

export const QUESTION_TYPES: { value: HrQuestionType; label: string }[] = [
  { value: 'text',     label: 'Короткий текст' },
  { value: 'textarea', label: 'Длинный текст' },
  { value: 'phone',    label: 'Телефон' },
  { value: 'email',    label: 'Email' },
  { value: 'number',   label: 'Число' },
  { value: 'select',   label: 'Выбор из списка' },
]
