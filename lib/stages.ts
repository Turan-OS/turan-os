// Единый источник этапов воронки (канбан, карточка сделки, дашборд).
export type StageKey =
  | 'primary' | 'qualif' | 'review' | 'decision' | 'payment' | 'nurture' | 'resident' | 'rejected'

export interface Stage { key: StageKey; title: string; color: string }

export const STAGES: Stage[] = [
  { key: 'primary',  title: 'Первичный контакт', color: '#5b9bd5' },
  { key: 'qualif',   title: 'Квалификация',       color: '#c9bf3d' },
  { key: 'review',   title: 'На проверке',        color: '#9fcf5f' },
  { key: 'decision', title: 'Принимают решение',  color: '#f5a623' },
  { key: 'payment',  title: 'Жду оплату',         color: '#cdd84a' },
  { key: 'nurture',  title: 'Дозревают',          color: '#e3b9d6' },
  { key: 'resident', title: 'Резидент',           color: '#0a9a55' },
  { key: 'rejected', title: 'Отказ',              color: '#aab2bd' },
]

export const STAGE_TITLE: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.title]))
export const STAGE_COLOR: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.color]))

export const FIRST_STAGE: StageKey = 'primary'
export const WON_STAGE: StageKey = 'resident'

// этапы для воронки (без «Отказа»)
export const FUNNEL_STAGES = STAGES.filter(s => s.key !== 'rejected')

// заголовок этапа → ключ (новые + старые названия для исторических записей активности)
export const TITLE_TO_KEY: Record<string, StageKey> = {
  ...Object.fromEntries(STAGES.map(s => [s.title, s.key])) as Record<string, StageKey>,
  'Новые': 'primary', 'Связались': 'qualif', 'На встрече': 'review',
}

// ─── Единый статус контакта и сделки ───
// Префаза: статусы контакта в базе ДО завода сделки. Дальше — те же этапы воронки.
export const PRE_STATUSES: { title: string; color: string }[] = [
  { title: 'Новый',                color: '#00955a' },
  { title: 'Нет ответа',           color: '#8a929c' },
  { title: 'Перезвонить',          color: '#b87613' },
  { title: 'Не подходит',          color: '#8a929c' },
  { title: 'Спам',                 color: '#8a929c' },
  { title: 'Тестовое мероприятие', color: '#7a5bd0' },
]

// Единый список статусов контакта = префаза + этапы воронки (один пайплайн)
export const CONTACT_STATUSES: string[] = [...PRE_STATUSES.map(s => s.title), ...STAGES.map(s => s.title)]

export const CONTACT_STATUS_COLOR: Record<string, string> = {
  ...Object.fromEntries(PRE_STATUSES.map(s => [s.title, s.color])),
  ...Object.fromEntries(STAGES.map(s => [s.title, s.color])),
}

// если статус контакта = этап воронки, вернёт его ключ (для синхронизации со сделкой)
export function stageKeyForStatus(title?: string | null): StageKey | undefined {
  return title ? TITLE_TO_KEY[title] : undefined
}
