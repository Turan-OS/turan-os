'use client'

import { useState, useRef } from 'react'

interface Props {
  addComment: (fd: FormData) => Promise<void>
  addTask: (fd: FormData) => Promise<void>
  logCall: (fd: FormData) => Promise<void>
  responsible?: string | null
}

// ── Хелперы для datetime-local значения ──
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function addMin(min: number) { return toLocalInput(new Date(Date.now() + min * 60000)) }
function atTime(daysAhead: number, h: number, m = 0) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(h, m, 0, 0); return toLocalInput(d)
}
function endOfWeek(h: number, m = 0) {
  const d = new Date(); const until = (7 - d.getDay()) % 7; d.setDate(d.getDate() + until); d.setHours(h, m, 0, 0); return toLocalInput(d)
}
function nextMonth(h: number, m = 0) { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setHours(h, m, 0, 0); return toLocalInput(d) }
function nextYear(h: number, m = 0) { const d = new Date(); d.setFullYear(d.getFullYear() + 1); d.setHours(h, m, 0, 0); return toLocalInput(d) }

const PRESETS: { label: string; get: () => string }[] = [
  { label: 'Через 15 минут', get: () => addMin(15) },
  { label: 'Через 30 минут', get: () => addMin(30) },
  { label: 'Через час',      get: () => addMin(60) },
  { label: 'Сегодня',        get: () => atTime(0, 18) },
  { label: 'Завтра',         get: () => atTime(1, 10) },
  { label: 'До конца недели',get: () => endOfWeek(18) },
  { label: 'Через неделю',   get: () => atTime(7, 10) },
  { label: 'Через месяц',    get: () => nextMonth(10) },
  { label: 'Через год',      get: () => nextYear(10) },
]

const TASK_TYPES = ['Связаться', 'Перезвонить', 'Встреча', 'Отправить КП', 'Дожать оплату']

const fmtWhen = (iso: string) => iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function ActivityComposer({ addComment, addTask, logCall, responsible }: Props) {
  const [mode, setMode] = useState<'note' | 'task' | 'call'>('note')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const noteRef = useRef<HTMLFormElement>(null)
  const taskRef = useRef<HTMLFormElement>(null)
  const callRef = useRef<HTMLFormElement>(null)

  const resetTask = () => { setTitle(''); setDue(''); setActivePreset(null) }

  const tab = (active: boolean): React.CSSProperties => ({
    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '7px 14px',
    borderRadius: 8, border: 'none', fontFamily: 'inherit',
    background: active ? '#eaf7f0' : 'transparent',
    color: active ? '#127a98' : '#8a929c',
  })

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(16,24,40,0.05)' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button onClick={() => setMode('note')} style={tab(mode === 'note')}>Примечание</button>
        <button onClick={() => setMode('task')} style={tab(mode === 'task')}>Задача</button>
        <button onClick={() => setMode('call')} style={tab(mode === 'call')}>📞 Дозвон</button>
      </div>

      {mode === 'note' && (
        <form ref={noteRef} action={async (fd) => { await addComment(fd); noteRef.current?.reset() }}>
          <textarea name="body" placeholder="Написать примечание…" rows={2} required className="admin-input" style={{ resize: 'vertical', marginBottom: 10 }} />
          <button type="submit" className="admin-btn-primary" style={{ padding: '9px 18px' }}>Добавить</button>
        </form>
      )}

      {mode === 'call' && (
        <form ref={callRef} action={async (fd) => { await logCall(fd); callRef.current?.reset() }}>
          <input name="result" placeholder="Результат звонка (необязательно)…" className="admin-input" style={{ marginBottom: 10 }} />
          <button type="submit" className="admin-btn-primary" style={{ padding: '9px 18px' }}>📞 Записать дозвон</button>
        </form>
      )}

      {mode === 'task' && (
        <form ref={taskRef} action={async (fd) => { await addTask(fd); resetTask() }}>
          {/* строка задачи как в amoCRM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#127a98' }}>Задача</span>
            {due && <span style={{ fontSize: 13, color: '#3a4250' }}>на <b>{fmtWhen(due)}</b></span>}
            <span style={{ fontSize: 13, color: '#8a929c' }}>для <b style={{ color: '#3a4250' }}>{responsible || 'вас'}</b></span>
          </div>

          <input name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Что нужно сделать…" required className="admin-input" style={{ marginBottom: 8 }} />

          {/* быстрые типы задач */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {TASK_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setTitle(t)}
                style={{ fontSize: 12, cursor: 'pointer', padding: '5px 11px', borderRadius: 20, border: '1px solid #e4e7ec', background: title === t ? 'rgba(30,170,209,0.1)' : '#f7f8fa', color: title === t ? '#127a98' : '#5b6470', fontFamily: 'inherit' }}>
                {t}
              </button>
            ))}
          </div>

          {/* срок: пресеты */}
          <div style={{ fontSize: 11, color: '#8a929c', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 7 }}>Когда</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {PRESETS.map(p => {
              const active = activePreset === p.label
              return (
                <button key={p.label} type="button" onClick={() => { setDue(p.get()); setActivePreset(p.label) }}
                  style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, border: `1px solid ${active ? '#1EAAD1' : '#e4e7ec'}`, background: active ? 'rgba(30,170,209,0.1)' : '#fff', color: active ? '#127a98' : '#5b6470', fontFamily: 'inherit' }}>
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* точная дата/время */}
          <input type="datetime-local" value={due} onChange={e => { setDue(e.target.value); setActivePreset(null) }} className="admin-input" style={{ marginBottom: 14, maxWidth: 260 }} />
          <input type="hidden" name="due_date" value={due ? new Date(due).toISOString() : ''} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="admin-btn-primary" style={{ padding: '10px 28px' }}>Поставить</button>
            <button type="button" onClick={() => { resetTask(); setMode('note') }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d7dce3', background: '#fff', color: '#5b6470', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Отменить</button>
          </div>
        </form>
      )}
    </div>
  )
}
