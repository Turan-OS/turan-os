import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'
import type { ApplicationTask } from '@/lib/supabase'

type AppRow = { id: number; name: string | null; contact: string | null; responsible: string | null; status: string | null }
type ContactRow = { id: number; name: string | null; phone: string | null; responsible_id: number | null }

const COLS = [
  { key: 'overdue', title: 'Просроченные задачи', color: '#e0574a' },
  { key: 'today',   title: 'Задачи на сегодня',   color: '#1fc16b' },
  { key: 'tomorrow',title: 'Задачи на завтра',    color: '#4a90e2' },
  { key: 'week',    title: 'Следующая неделя',    color: '#8a929c' },
  { key: 'month',   title: 'Задачи на месяц',     color: '#8a929c' },
  { key: 'future',  title: 'Задачи на будущее',   color: '#8a929c' },
  { key: 'none',    title: 'Без срока',           color: '#cbd2da' },
] as const

export default async function TasksPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  const isManager = me.role === 'manager'

  const { data: tasksData } = await supabaseAdmin.from('application_tasks').select('*').eq('done', false)
  const tasks = (tasksData as ApplicationTask[]) ?? []

  const appIds = [...new Set(tasks.map(t => t.application_id).filter(Boolean))] as number[]
  const contactIds = [...new Set(tasks.map(t => t.contact_id).filter(Boolean))] as number[]

  const [{ data: appsData }, { data: contactsData }] = await Promise.all([
    appIds.length ? supabaseAdmin.from('applications').select('id, name, contact, responsible, status').in('id', appIds) : Promise.resolve({ data: [] as AppRow[] }),
    contactIds.length ? supabaseAdmin.from('contacts').select('id, name, phone, responsible_id').in('id', contactIds) : Promise.resolve({ data: [] as ContactRow[] }),
  ])
  const appMap = new Map((appsData as AppRow[] ?? []).map(a => [a.id, a]))
  const contactMap = new Map((contactsData as ContactRow[] ?? []).map(c => [c.id, c]))

  // границы дат
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const d1 = startToday.getTime() + 86400000          // завтра 00:00
  const d2 = startToday.getTime() + 2 * 86400000       // послезавтра
  const d8 = startToday.getTime() + 8 * 86400000       // конец след. недели
  const d31 = startToday.getTime() + 31 * 86400000     // месяц

  const bucketOf = (due?: string | null) => {
    if (!due) return 'none'
    const t = new Date(due).getTime()
    if (t < startToday.getTime()) return 'overdue'
    if (t < d1) return 'today'
    if (t < d2) return 'tomorrow'
    if (t < d8) return 'week'
    if (t < d31) return 'month'
    return 'future'
  }
  const dateLabel = (due?: string | null) => {
    if (!due) return 'Без срока'
    const d = new Date(due); const ds = new Date(d); ds.setHours(0, 0, 0, 0)
    if (ds.getTime() === startToday.getTime()) return 'Сегодня'
    if (ds.getTime() === startToday.getTime() + 86400000) return 'Завтра'
    if (ds.getTime() === startToday.getTime() - 86400000) return 'Вчера'
    return d.toLocaleDateString('ru-RU')
  }

  type Card = { id: number; name: string; phone: string; href: string; responsible: string; due?: string | null; title: string; bucket: string }
  const cards: Card[] = []
  for (const t of tasks) {
    const app = t.application_id ? appMap.get(t.application_id) : undefined
    const c = t.contact_id ? contactMap.get(t.contact_id) : undefined
    // видимость для менеджера
    if (isManager) {
      const mine = app ? app.responsible === me.name : c ? c.responsible_id === me.uid : false
      if (!mine) continue
    }
    const href = t.application_id ? `/admin/applications/${t.application_id}` : t.contact_id ? `/admin/contacts/${t.contact_id}` : '#'
    cards.push({
      id: t.id,
      name: app?.name || c?.name || 'Без имени',
      phone: app?.contact || c?.phone || '',
      href,
      responsible: app?.responsible || '—',
      due: t.due_date,
      title: t.title,
      bucket: bucketOf(t.due_date),
    })
  }
  // сортировка по сроку внутри колонок
  cards.sort((a, b) => (a.due ? new Date(a.due).getTime() : Infinity) - (b.due ? new Date(b.due).getTime() : Infinity))

  const byBucket = (k: string) => cards.filter(c => c.bucket === k)
  const visibleCols = COLS.filter(col => col.key !== 'none' || byBucket('none').length > 0)

  return (
    <div style={{ maxWidth: 1500 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Задачи</h1>
        <p style={{ fontSize: 13, color: '#8a929c' }}>{cards.length} активных задач</p>
      </div>

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
        {visibleCols.map(col => {
          const items = byBucket(col.key)
          return (
            <div key={col.key} style={{ minWidth: 290, width: 290, flexShrink: 0 }}>
              <div style={{ borderTop: `3px solid ${col.color}`, borderRadius: '3px 3px 0 0', paddingTop: 12, marginBottom: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#3a4250', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{col.title}</div>
                <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>{items.length} задач</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(card => (
                  <Link key={card.id} href={card.href} style={{ textDecoration: 'none' }}>
                    <div className="task-card" style={{ background: '#fff', border: '1px solid #e8ebef', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
                      <div style={{ fontSize: 12, color: '#8a929c', marginBottom: 2 }}>{card.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2a6fdb', marginBottom: 6, lineHeight: 1.3 }}>
                        {card.phone || `Сделка #${card.id}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#aab2bd', marginBottom: 6 }}>
                        <span style={{ color: col.key === 'overdue' ? '#e0574a' : col.key === 'today' ? '#1fc16b' : '#8a929c', fontWeight: 600 }}>{dateLabel(card.due)}</span>
                        {' · для '}{card.responsible}
                      </div>
                      <div style={{ fontSize: 13.5, color: '#1f2329', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: '#1fc16b' }}>⟳</span>{card.title}
                      </div>
                    </div>
                  </Link>
                ))}
                {items.length === 0 && <div style={{ fontSize: 12, color: '#c2c8d0', textAlign: 'center', padding: '16px 0' }}>—</div>}
              </div>
            </div>
          )
        })}
      </div>

      {cards.length === 0 && (
        <div className="admin-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#8a929c', fontSize: 14 }}>
          Активных задач нет. Ставьте задачи в карточке сделки.
        </div>
      )}

      <style>{`.task-card:hover { border-color: #bfe2ef; box-shadow: 0 2px 10px rgba(16,24,40,0.08); }`}</style>
    </div>
  )
}
