'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

export type FeedItem =
  | { kind: 'created'; at: number }
  | { kind: 'stage' | 'system' | 'call' | 'lead'; at: number; text: string; who?: string | null }
  | { kind: 'note'; at: number; id: number; body: string; who?: string | null }
  | { kind: 'task'; at: number; id: number; title: string; done: boolean; result?: string | null; due?: string | null; who?: string | null }

const fmtDT = (at: number) => new Date(at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDue = (s: string) => new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
function overdueFor(due: string): string {
  const min = Math.floor((Date.now() - new Date(due).getTime()) / 60000)
  if (min < 60) return `${Math.max(1, min)} мин.`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} ч.`
  return `${Math.floor(h / 24)} дн.`
}
const monthLabel = (at: number) => { const d = new Date(at); const m = d.toLocaleString('ru-RU', { month: 'long' }); return `${m.charAt(0).toUpperCase()}${m.slice(1)}, ${d.getFullYear()}` }

const textOf = (it: FeedItem) => it.kind === 'note' ? it.body : it.kind === 'task' ? it.title : 'text' in it ? it.text : ''

export default function DealFeed({ items, delComment, toggleTask, completeTask, delTask }: {
  items: FeedItem[]
  delComment: (id: number) => Promise<void>
  toggleTask: (id: number, done: boolean) => Promise<void>
  completeTask: (id: number, fd: FormData) => Promise<void>
  delTask: (id: number) => Promise<void>
}) {
  const [q, setQ] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [items.length])

  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.at - b.at)
    if (!q.trim()) return sorted
    const k = q.toLowerCase()
    return sorted.filter(it => textOf(it).toLowerCase().includes(k))
  }, [items, q])

  const groups: { label: string; items: FeedItem[] }[] = []
  let cur = ''
  for (const it of filtered) {
    const m = monthLabel(it.at)
    if (m !== cur) { groups.push({ label: m, items: [] }); cur = m }
    groups[groups.length - 1].items.push(it)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Поиск */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aab2bd', fontSize: 14 }}>⌕</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск и фильтр"
            style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1px solid #e4e7ec', borderRadius: 10, fontSize: 13.5, outline: 'none', background: '#fff', color: '#1f2329' }} />
        </div>
      </div>

      {/* История */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 4px 8px' }}>
        {groups.length === 0 && <div style={{ fontSize: 13, color: '#aab2bd', padding: '12px 4px', textAlign: 'center' }}>{q ? 'Ничего не найдено' : 'Истории пока нет'}</div>}
        {groups.map((g, gi) => (
          <Fragment key={gi}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 2px' }}>
              <span style={{ fontSize: 12, color: '#8a929c', background: '#eef0f3', borderRadius: 20, padding: '4px 14px', fontWeight: 500 }}>{g.label}</span>
            </div>
            {g.items.map((it, idx) => <Item key={idx} it={it} delComment={delComment} toggleTask={toggleTask} completeTask={completeTask} delTask={delTask} />)}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function PlainLine({ at, who, children }: { at: number; who?: string | null; children?: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: '#6b7480', padding: '2px 6px', lineHeight: 1.5 }}>
      <span style={{ color: '#aab2bd' }}>{fmtDT(at)}</span>{who ? <span style={{ color: '#8a929c' }}> {who}</span> : ''} {children}
    </div>
  )
}

function Card({ avatar, avatarBg, header, children, onDelete }: { avatar: React.ReactNode; avatarBg?: string; header: React.ReactNode; children: React.ReactNode; onDelete?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #e8ebef', borderRadius: 12, alignItems: 'flex-start', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
      <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: avatarBg ?? '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginTop: 1 }}>{avatar}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#aab2bd', marginBottom: 3 }}>{header}</div>
        <div style={{ fontSize: 13.5, color: '#1f2329', lineHeight: 1.5 }}>{children}</div>
      </div>
      {onDelete}
    </div>
  )
}

function DelBtn({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button type="submit" title="Удалить" style={{ background: 'none', border: 'none', color: '#cdd3db', cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>
    </form>
  )
}

function Item({ it, delComment, toggleTask, completeTask, delTask }: {
  it: FeedItem
  delComment: (id: number) => Promise<void>
  toggleTask: (id: number, done: boolean) => Promise<void>
  completeTask: (id: number, fd: FormData) => Promise<void>
  delTask: (id: number) => Promise<void>
}) {
  if (it.kind === 'note') return (
    <Card avatar="📝" avatarBg="#eef0f3" header={<>{fmtDT(it.at)}{it.who ? ` · ${it.who}` : ''}</>} onDelete={<DelBtn action={delComment.bind(null, it.id)} />}>
      <span style={{ whiteSpace: 'pre-line' }}>{it.body}</span>
    </Card>
  )

  if (it.kind === 'call') return (
    <Card avatar="📞" avatarBg="#e7f0fb" header={<>{fmtDT(it.at)}{it.who ? ` · ${it.who}` : ''}</>}>{it.text}</Card>
  )

  if (it.kind === 'task') {
    const overdue = !it.done && !!it.due && new Date(it.due).getTime() < Date.now()
    return (
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#fff', border: `1px solid ${overdue ? '#f3c6c0' : '#e8ebef'}`, borderRadius: 12, alignItems: 'flex-start', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
        {it.done ? (
          <form action={toggleTask.bind(null, it.id, false)} style={{ marginTop: 1 }}>
            <button type="submit" title="Вернуть в работу" style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: 'none', background: '#1fc16b', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✓</button>
          </form>
        ) : (
          <form action={completeTask.bind(null, it.id)} style={{ marginTop: 1 }}>
            <button type="submit" title="Выполнить (без результата)" style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', background: '#fff', border: `1.5px solid ${overdue ? '#e0574a' : '#cbd2da'}`, color: overdue ? '#e0574a' : '#aab2bd', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>🕐</button>
          </form>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: overdue ? '#e0574a' : '#aab2bd', marginBottom: 3 }}>
            {fmtDT(it.at)}{it.who ? ` · ${it.who}` : ''}{it.due ? <span style={{ color: overdue ? '#e0574a' : '#c98a00' }}> · {overdue ? `просрочена на ${overdueFor(it.due)}` : `до ${fmtDue(it.due)}`}</span> : ''}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 600, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? '#aab2bd' : '#1f2329', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#1fc16b' }}>⟳</span>{it.title}
          </div>
          {it.done && it.result && <div style={{ fontSize: 13, color: '#3a4250', marginTop: 5 }}>{it.result}</div>}
          {!it.done && (
            <form action={completeTask.bind(null, it.id)} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input name="result" placeholder="Добавить результат" style={{ flex: 1, padding: '8px 11px', fontSize: 13, border: '1px solid #e4e7ec', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }} />
              <button type="submit" className="admin-btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Выполнить</button>
            </form>
          )}
        </div>
        <DelBtn action={delTask.bind(null, it.id)} />
      </div>
    )
  }

  // created / system / stage / lead — простая строка
  const who = it.kind === 'created' ? null : it.who
  return <PlainLine at={it.at} who={who}>{it.kind === 'created' ? 'Заявка создана' : it.text}</PlainLine>
}
