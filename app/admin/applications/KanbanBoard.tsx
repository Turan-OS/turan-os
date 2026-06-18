'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Application, ApplicationStatus } from '@/lib/supabase'
import { STAGES } from '@/lib/stages'
import CrmTour, { type TourStep } from '@/components/CrmTour'

const TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="search"]', title: 'Поиск по сделкам', text: 'Быстро находи нужную сделку по имени, контакту или сфере. Удобно, когда сделок много.' },
  { selector: '[data-tour="column"]', title: 'Этапы воронки', text: 'Каждая колонка — стадия сделки: от первичного контакта до резидента. Перетаскивай карточку в следующую колонку, когда сделка двигается дальше.' },
  { selector: '[data-tour="card"]', title: 'Карточка сделки', text: 'Клик — открыть сделку, ✕ — удалить. Внизу карточки: дата и индикатор задачи — 🟢 на сегодня, 🔴 просрочена, ⚪ без задач. Старайся не оставлять сделки без задач.' },
  { title: 'Внутри сделки', text: 'Открой сделку, чтобы вести её: меняй статус, ставь задачи-напоминания, пиши комментарии и общайся с клиентом. Веди каждую сделку до результата.' },
]

const COLUMNS = STAGES

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n)
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''
function overdueFor(due?: string | null): string {
  if (!due) return ''
  const ms = Date.now() - new Date(due).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${Math.max(1, min)} мин.`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} ч.`
  return `${Math.floor(h / 24)} дн.`
}

type TaskState = 'overdue' | 'today' | 'future' | 'has'
const TASK_VIEW: Record<TaskState, { color: string }> = {
  overdue: { color: '#e0574a' },
  today:   { color: '#1fc16b' },
  future:  { color: '#4a90e2' },
  has:     { color: '#1fc16b' },
}
function taskLabel(info?: { state: TaskState; due: string | null }): { color: string; text: string } {
  if (!info) return { color: '#cbd2da', text: 'Без задач' }
  const { state, due } = info
  if (state === 'overdue') return { color: TASK_VIEW.overdue.color, text: `Просрочена на ${overdueFor(due)}` }
  if (state === 'today')   return { color: TASK_VIEW.today.color, text: 'Сегодня' }
  if (state === 'future')  return { color: TASK_VIEW.future.color, text: fmtDate(due) }
  return { color: TASK_VIEW.has.color, text: 'Без срока' }
}

interface Props {
  items: Application[]
  setStatus: (id: number, status: ApplicationStatus) => Promise<void>
  remove: (id: number) => Promise<void>
  taskInfo: Record<number, { state: TaskState; due: string | null }>
  noAnswer: Record<number, { total: number; streak: number }>
}

export default function KanbanBoard({ items, setStatus, remove, taskInfo, noAnswer }: Props) {
  const router = useRouter()
  const [cards, setCards] = useState(items)
  // подхватываем новые данные с сервера (например, после добавления заявки) без перезагрузки
  useEffect(() => { setCards(items) }, [items])
  const [dragId, setDragId] = useState<number | null>(null)
  const [overCol, setOverCol] = useState<ApplicationStatus | null>(null)
  const [query, setQuery] = useState('')
  const draggingRef = useRef(false)

  const move = (id: number, status: ApplicationStatus) => {
    const card = cards.find(c => c.id === id)
    if (!card || card.status === status) return
    setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setStatus(id, status)
  }

  const onDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setCards(prev => prev.filter(c => c.id !== id))
    remove(id)
  }

  const open = (id: number) => {
    if (draggingRef.current) return
    router.push(`/admin/applications/${id}`)
  }

  const q = query.trim().toLowerCase()
  const match = (c: Application) =>
    !q || [c.name, c.contact, c.sphere, c.instagram, c.motivation]
      .some(v => (v ?? '').toLowerCase().includes(q))

  return (
    <div>
      {/* Поиск */}
      <div data-tour="search" style={{ position: 'relative', maxWidth: 360, marginBottom: 18 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9aa3ad', fontSize: 14 }}>⌕</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по имени, контакту, сфере…"
          style={{
            width: '100%', padding: '10px 14px 10px 34px', fontSize: 14,
            background: '#fff', border: '1px solid #d7dce3', borderRadius: 9,
            color: '#1f2329', outline: 'none', fontFamily: 'inherit',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#aab2bd', cursor: 'pointer', fontSize: 14 }}>✕</button>
        )}
      </div>

      {/* Доска */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12 }}>
        {COLUMNS.map((col, ci) => {
          const colCards = cards.filter(c => c.status === col.key && match(c))
          const colSum = colCards.reduce((s, c) => s + (c.amount ?? 0), 0)
          const isOver = overCol === col.key
          return (
            <div
              key={col.key}
              data-tour={ci === 0 ? 'column' : undefined}
              onDragOver={e => { e.preventDefault(); setOverCol(col.key) }}
              onDragLeave={() => setOverCol(o => o === col.key ? null : o)}
              onDrop={() => { if (dragId != null) move(dragId, col.key); setDragId(null); setOverCol(null) }}
              style={{
                flex: '1 0 250px', minWidth: 250, maxWidth: 340,
                background: isOver ? '#e9faf1' : '#f4f6f8',
                borderLeft: `1px solid ${isOver ? col.color : '#e4e7ec'}`,
                borderRight: `1px solid ${isOver ? col.color : '#e4e7ec'}`,
                borderBottom: `1px solid ${isOver ? col.color : '#e4e7ec'}`,
                borderTop: `3px solid ${col.color}`,
                borderRadius: '0 0 12px 12px', padding: 10,
                transition: 'background 0.15s, border-color 0.15s',
                alignSelf: 'flex-start',
              }}
            >
              {/* Заголовок колонки */}
              <div style={{ padding: '6px 6px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3a4250', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{col.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#9aa3ad', marginLeft: 'auto' }}>{colCards.length}</span>
                </div>
                {colSum > 0 && <div style={{ fontSize: 11, color: '#8a929c', marginTop: 3 }}>{fmt(colSum)} сум</div>}
              </div>

              {/* Карточки */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 50 }}>
                {colCards.map(c => (
                  <div
                    key={c.id}
                    data-tour="card"
                    draggable
                    onDragStart={() => { draggingRef.current = true; setDragId(c.id) }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); setTimeout(() => { draggingRef.current = false }, 60) }}
                    onClick={() => open(c.id)}
                    style={{
                      background: '#fff', border: '1px solid #e4e7ec', borderRadius: 9,
                      padding: '11px 12px', cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
                      opacity: dragId === c.id ? 0.4 : 1, transition: 'opacity 0.15s, box-shadow 0.15s',
                    }}
                    className="deal-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: '#1f2329', lineHeight: 1.3 }}>
                        {c.name || 'Без имени'}
                        {(() => {
                          const st = noAnswer[c.id]?.streak ?? 0
                          if (st <= 0) return null
                          const col = st >= 4 ? '#d24a3d' : '#b87613'
                          return <span title={`Без ответа подряд: ${st} (всего ${noAnswer[c.id]?.total ?? st})`} style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: col, background: col + '14', border: `1px solid ${col}40`, borderRadius: 5, padding: '1px 5px', whiteSpace: 'nowrap' }}>🔕 {st}</span>
                        })()}
                      </p>
                      <button onClick={e => onDelete(e, c.id)} title="Удалить" style={{
                        background: 'none', border: 'none', color: '#cdd3db', cursor: 'pointer',
                        fontSize: 13, lineHeight: 1, padding: 2, flexShrink: 0,
                      }}>✕</button>
                    </div>

                    {c.contact && (
                      <p style={{ fontSize: 12, color: '#127a98', fontWeight: 600, marginTop: 3, wordBreak: 'break-all' }}>{c.contact}</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 9 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.amount ? '#1f2329' : '#c2c8d0' }}>
                        {c.amount ? `${fmt(c.amount)} сум` : '—'}
                      </span>
                      {c.is_owner === 'Да' && c.profit === 'Да' && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#127a98', background: 'rgba(30,170,209,0.1)', border: '1px solid rgba(30,170,209,0.2)', borderRadius: 5, padding: '2px 7px' }}>квалиф.</span>
                      )}
                    </div>

                    {/* дата создания + индикатор задачи */}
                    {(() => {
                      const tl = taskLabel(taskInfo[c.id])
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 9, paddingTop: 8, borderTop: '1px solid #f2f4f7' }}>
                          <span style={{ fontSize: 11, color: '#aab2bd' }}>{fmtDate(c.created_at) || '—'}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: tl.color }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tl.color, flexShrink: 0 }} />
                            {tl.text}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                ))}

                {colCards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 8px', color: '#b8bfc8', fontSize: 12 }}>
                    {q ? 'Ничего не найдено' : 'Перетащите сюда'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`.deal-card:hover { box-shadow: 0 3px 10px rgba(16,24,40,0.1) !important; }`}</style>

      <CrmTour steps={TOUR_STEPS} storageKey="pbc_crm_tour_done_v1" buttonLabel="Обучение" />
    </div>
  )
}
