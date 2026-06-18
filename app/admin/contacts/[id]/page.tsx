import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import { insertHistory } from '@/lib/history'
import { CONTACT_STATUSES, stageKeyForStatus } from '@/lib/stages'
import type { Contact, ApplicationComment, ApplicationTask, ApplicationActivity } from '@/lib/supabase'

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const STATUSES = CONTACT_STATUSES
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13.5, border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '12px 0 6px' }
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cid = Number(id)

  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  const { data: cData } = await supabaseAdmin.from('contacts').select('*').eq('id', cid).single()
  if (!cData) notFound()
  const c = cData as Contact
  // менеджер видит только свои контакты
  if (me.role === 'manager' && c.responsible_id !== me.uid) redirect('/admin/contacts')

  const [{ data: commentsData }, { data: activityData }, { data: tasksData }] = await Promise.all([
    supabaseAdmin.from('application_comments').select('*').eq('contact_id', cid),
    supabaseAdmin.from('application_activity').select('*').eq('contact_id', cid),
    supabaseAdmin.from('application_tasks').select('*').eq('contact_id', cid),
  ])
  const comments = (commentsData as ApplicationComment[]) ?? []
  const activity = (activityData as ApplicationActivity[]) ?? []
  const tasks = (tasksData as ApplicationTask[]) ?? []

  // ── server actions: лог прямо на контакте ──
  async function addNote(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const body = (formData.get('body') as string || '').trim()
    if (!body) return
    const { data: cc } = await supabaseAdmin.from('contacts').select('application_id').eq('id', cid).single()
    await insertHistory('application_comments', { application_id: cc?.application_id ?? null, contact_id: cid, body, user_id: u?.uid ?? null })
    revalidatePath(`/admin/contacts/${cid}`)
  }
  async function logCall(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const result = (formData.get('result') as string || '').trim()
    const { data: cc } = await supabaseAdmin.from('contacts').select('application_id').eq('id', cid).single()
    await insertHistory('application_activity', {
      application_id: cc?.application_id ?? null, contact_id: cid, type: 'call',
      text: result ? `Дозвон: ${result}` : 'Дозвон', user_id: u?.uid ?? null, user_name: u?.name ?? null,
    })
    revalidatePath(`/admin/contacts/${cid}`)
  }
  async function delNote(commentId: number) {
    'use server'
    await supabaseAdmin.from('application_comments').delete().eq('id', commentId)
    revalidatePath(`/admin/contacts/${cid}`)
  }
  async function saveContact(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    if (!u) return
    // менеджер может править только свои контакты
    const { data: cur } = await supabaseAdmin.from('contacts').select('responsible_id, application_id').eq('id', cid).single()
    if (u.role === 'manager' && cur?.responsible_id !== u.uid) return
    const g = (k: string) => (formData.get(k) as string)?.trim() || null
    const status = g('status')
    await supabaseAdmin.from('contacts').update({
      name: g('name'), phone: g('phone'), telegram: g('telegram'),
      status, niche: g('niche'), turnover: g('turnover'),
      source: g('source'), comment: g('comment'),
    }).eq('id', cid)
    // синхронизация: статус = этап воронки и есть сделка → двигаем сделку
    const key = stageKeyForStatus(status)
    if (key && cur?.application_id) {
      await supabaseAdmin.from('applications').update({ status: key }).eq('id', cur.application_id)
      revalidatePath(`/admin/applications/${cur.application_id}`); revalidatePath('/admin/applications')
    }
    revalidatePath(`/admin/contacts/${cid}`); revalidatePath('/admin/contacts')
  }

  // ── единая лента ──
  type Feed =
    | { kind: 'note'; at: number; id: number; body: string }
    | { kind: 'call' | 'stage' | 'lead' | 'system'; at: number; text: string; who?: string | null }
    | { kind: 'task'; at: number; title: string; done: boolean; due?: string | null }
  const t = (s?: string) => s ? new Date(s).getTime() : 0
  const feed: Feed[] = [
    ...comments.map(x => ({ kind: 'note' as const, at: t(x.created_at), id: x.id, body: x.body })),
    ...activity.map(a => ({ kind: (['call', 'stage', 'lead'].includes(a.type) ? a.type : 'system') as 'call' | 'stage' | 'lead' | 'system', at: t(a.created_at), text: a.text, who: a.user_name })),
    ...tasks.map(tk => ({ kind: 'task' as const, at: t(tk.created_at), title: tk.title, done: tk.done, due: tk.due_date })),
  ].sort((a, b) => b.at - a.at)

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/contacts" style={{ fontSize: 13, color: '#8a929c', textDecoration: 'none' }}>← В базу контактов</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }} className="deal-grid">
        {/* Левая колонка — редактируемая карточка контакта */}
        <form action={saveContact} className="admin-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Контакт #{c.id}</div>
            {c.phone && <a href={`tel:${c.phone}`} title="Позвонить" style={{ fontSize: 12, color: '#127a98', textDecoration: 'none', fontWeight: 600 }}>📞 Позвонить</a>}
          </div>

          <label style={lbl}>Имя</label>
          <input name="name" defaultValue={c.name ?? ''} style={inp} placeholder="Имя" />

          <div style={row2}>
            <div><label style={lbl}>Телефон</label><input name="phone" defaultValue={c.phone ?? ''} style={inp} placeholder="+998…" /></div>
            <div><label style={lbl}>Telegram</label><input name="telegram" defaultValue={c.telegram ?? ''} style={inp} placeholder="@username" /></div>
          </div>

          <label style={lbl}>Статус</label>
          <select name="status" defaultValue={c.status ?? ''} style={inp}>
            <option value="">—</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div style={row2}>
            <div><label style={lbl}>Ниша</label><input name="niche" defaultValue={c.niche ?? ''} style={inp} /></div>
            <div><label style={lbl}>Оборот</label><input name="turnover" defaultValue={c.turnover ?? ''} style={inp} /></div>
          </div>

          <label style={lbl}>Источник</label>
          <input name="source" defaultValue={c.source ?? ''} style={inp} />

          <label style={lbl}>Комментарий</label>
          <textarea name="comment" defaultValue={c.comment ?? ''} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Комментарий по контакту…" />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
            <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px' }}>Сохранить</button>
            {c.application_id
              ? <Link href={`/admin/applications/${c.application_id}`} className="admin-btn-ghost" style={{ borderColor: '#bfe9d2', color: '#127a98' }}>Открыть лид →</Link>
              : <span style={{ fontSize: 12, color: '#aab2bd' }}>Лид не заведён</span>}
          </div>
        </form>

        {/* Правая колонка — история */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Композер */}
          <div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form action={addNote} style={{ display: 'flex', gap: 8 }}>
              <input name="body" placeholder="Заметка по контакту…" className="admin-input" style={{ flex: 1, padding: '9px 12px' }} />
              <button type="submit" className="admin-btn-ghost">Заметка</button>
            </form>
            <form action={logCall} style={{ display: 'flex', gap: 8 }}>
              <input name="result" placeholder="Результат звонка (необязательно)" className="admin-input" style={{ flex: 1, padding: '9px 12px' }} />
              <button type="submit" className="admin-btn-primary" style={{ padding: '9px 18px' }}>📞 Дозвон</button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#8a929c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 2px' }}>
              История взаимодействия {feed.length > 0 && <span style={{ color: '#aab2bd' }}>· {feed.length}</span>}
            </div>
            {feed.length === 0 && <div style={{ fontSize: 13, color: '#aab2bd', padding: '12px 4px' }}>Истории пока нет. Запиши первый звонок или заметку выше.</div>}
            {feed.map((it, idx) => {
              if (it.kind === 'note') return (
                <Row key={idx} icon="✎" color="#3a7bd5" at={it.at} action={
                  <form action={delNote.bind(null, it.id)}><button type="submit" title="Удалить" style={{ background: 'none', border: 'none', color: '#cdd3db', cursor: 'pointer', fontSize: 13 }}>✕</button></form>
                }><span style={{ whiteSpace: 'pre-line' }}>{it.body}</span></Row>
              )
              if (it.kind === 'call')   return <Row key={idx} icon="📞" color="#3a7bd5" at={it.at}>{it.text}{it.who ? <span style={{ color: '#aab2bd' }}> · {it.who}</span> : ''}</Row>
              if (it.kind === 'stage')  return <Row key={idx} icon="↗" color="#0a9a55" at={it.at}>{it.text}{it.who ? <span style={{ color: '#aab2bd' }}> · {it.who}</span> : ''}</Row>
              if (it.kind === 'lead')   return <Row key={idx} icon="→" color="#127a98" at={it.at}>{it.text}{it.who ? <span style={{ color: '#aab2bd' }}> · {it.who}</span> : ''}</Row>
              if (it.kind === 'task')   return <Row key={idx} icon="✓" color="#f0a020" at={it.at}><b style={{ fontWeight: 600 }}>Задача:</b> {it.title}{it.due ? <span style={{ fontSize: 11, color: '#8a929c', marginLeft: 8 }}>до {fmtDate(it.due)}</span> : ''}</Row>
              return <Row key={idx} icon="•" color="#8a929c" at={it.at}>{it.text}</Row>
            })}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:860px){ .deal-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function Row({ icon, color, at, children, action }: { icon: string; color: string; at: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #eef0f3', borderRadius: 9, alignItems: 'flex-start' }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: '#f4f6f8', color, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#3a4250', lineHeight: 1.55 }}>{children}</div>
        <div style={{ fontSize: 11, color: '#aab2bd', marginTop: 4 }}>{fmtDate(new Date(at).toISOString())}</div>
      </div>
      {action}
    </div>
  )
}
