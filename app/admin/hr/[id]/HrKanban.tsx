'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HR_STAGES } from '@/lib/hrStages'
import type { HrCandidate } from '@/lib/supabase'

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

interface Props {
  formId: number
  items: HrCandidate[]
  setStatus: (id: number, status: string) => Promise<void>
  remove: (id: number) => Promise<void>
}

export default function HrKanban({ formId, items, setStatus, remove }: Props) {
  const router = useRouter()
  const [cards, setCards] = useState(items)
  useEffect(() => { setCards(items) }, [items])
  const [dragId, setDragId] = useState<number | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const draggingRef = useRef(false)

  const move = (id: number, status: string) => {
    const card = cards.find(c => c.id === id)
    if (!card || card.status === status) return
    setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setStatus(id, status)
  }

  const onDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Удалить кандидата?')) return
    setCards(prev => prev.filter(c => c.id !== id))
    remove(id)
  }

  const open = (id: number) => {
    if (draggingRef.current) return
    router.push(`/admin/hr/candidate/${id}`)
  }

  const q = query.trim().toLowerCase()
  const match = (c: HrCandidate) => !q || [c.name, c.contact, ...Object.values(c.answers || {})]
    .some(v => (v ?? '').toString().toLowerCase().includes(q))

  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9aa3ad', fontSize: 14 }}>⌕</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по кандидатам…"
          style={{ width: '100%', padding: '10px 14px 10px 34px', fontSize: 14, background: '#fff', border: '1px solid #d7dce3', borderRadius: 9, color: '#1f2329', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
        {HR_STAGES.map(col => {
          const colCards = cards.filter(c => c.status === col.key && match(c))
          const isOver = overCol === col.key
          return (
            <div key={col.key}
              onDragOver={e => { e.preventDefault(); setOverCol(col.key) }}
              onDragLeave={() => setOverCol(o => o === col.key ? null : o)}
              onDrop={() => { if (dragId != null) move(dragId, col.key); setDragId(null); setOverCol(null) }}
              style={{
                flex: '1 0 220px', minWidth: 220, maxWidth: 320,
                background: isOver ? '#eaf7fb' : '#f4f6f8',
                borderTop: `3px solid ${col.color}`,
                borderLeft: `1px solid ${isOver ? col.color : '#e4e7ec'}`, borderRight: `1px solid ${isOver ? col.color : '#e4e7ec'}`, borderBottom: `1px solid ${isOver ? col.color : '#e4e7ec'}`,
                borderRadius: '0 0 12px 12px', padding: 10, alignSelf: 'flex-start', transition: 'background 0.15s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3a4250', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{col.title}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9aa3ad', marginLeft: 'auto' }}>{colCards.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 50 }}>
                {colCards.map(c => (
                  <div key={c.id} draggable
                    onDragStart={() => { draggingRef.current = true; setDragId(c.id) }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); setTimeout(() => { draggingRef.current = false }, 60) }}
                    onClick={() => open(c.id)}
                    className="cand-card"
                    style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 9, padding: '11px 12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(16,24,40,0.05)', opacity: dragId === c.id ? 0.4 : 1, transition: 'opacity 0.15s, box-shadow 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: '#1f2329', lineHeight: 1.3 }}>{c.name || 'Без имени'}</p>
                      <button onClick={e => onDelete(e, c.id)} title="Удалить" style={{ background: 'none', border: 'none', color: '#cdd3db', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 2, flexShrink: 0 }}>✕</button>
                    </div>
                    {c.contact && <p style={{ fontSize: 12, color: '#127a98', fontWeight: 600, marginTop: 3, wordBreak: 'break-all' }}>{c.contact}</p>}
                    <div style={{ fontSize: 11, color: '#aab2bd', marginTop: 9, paddingTop: 8, borderTop: '1px solid #f2f4f7' }}>{fmtDate(c.created_at) || '—'}</div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '18px 8px', color: '#b8bfc8', fontSize: 12 }}>{q ? 'Ничего' : 'Перетащите сюда'}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`.cand-card:hover { box-shadow: 0 3px 10px rgba(16,24,40,0.1) !important; }`}</style>
    </div>
  )
}
