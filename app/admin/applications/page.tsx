import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/currentUser'
import type { Application, ApplicationStatus } from '@/lib/supabase'
import KanbanBoard from './KanbanBoard'
import AddDealButton from './AddDealButton'
import { insertHistory } from '@/lib/history'
import { STAGE_TITLE as STAGE_TITLES, FIRST_STAGE, WON_STAGE } from '@/lib/stages'

async function setStatus(id: number, status: ApplicationStatus) {
  'use server'
  const u = await getCurrentUser()
  const { data: prev } = await supabaseAdmin.from('applications').select('status').eq('id', id).single()
  await supabaseAdmin.from('applications').update({ status }).eq('id', id)
  // синхронизация: статус привязанного контакта = этап сделки
  await supabaseAdmin.from('contacts').update({ status: STAGE_TITLES[status] ?? status }).eq('application_id', id)
  if (prev && prev.status !== status) {
    const { data: lc } = await supabaseAdmin.from('contacts').select('id').eq('application_id', id).maybeSingle()
    await insertHistory('application_activity', {
      application_id: id, contact_id: lc?.id ?? null, type: 'stage',
      text: `Этап: ${STAGE_TITLES[prev.status] ?? prev.status} → ${STAGE_TITLES[status] ?? status}`,
      user_id: u?.uid ?? null, user_name: u?.name ?? null,
    })
  }
  revalidatePath('/admin/applications'); revalidatePath(`/admin/applications/${id}`); revalidatePath('/admin/contacts')
}

async function remove(id: number) {
  'use server'
  await supabaseAdmin.from('applications').delete().eq('id', id)
  revalidatePath('/admin/applications')
}

// Добавить заявку вручную + автоматически создать привязанный контакт в базе
async function createDeal(formData: FormData) {
  'use server'
  const u = await getCurrentUser()
  if (!u) return
  const g = (k: string) => (formData.get(k) as string)?.trim() || null
  const name = g('name'), phone = g('phone'), telegram = g('telegram')
  const sphere = g('sphere'), turnover = g('turnover'), comment = g('comment')
  const source = g('source') || 'Добавлен вручную'
  if (!name && !phone && !telegram) return

  // 1) контакт в базе (статус = первый этап воронки — единый статус)
  const { data: contact } = await supabaseAdmin.from('contacts').insert({
    name, phone, telegram, niche: sphere, turnover, source,
    status: STAGE_TITLES[FIRST_STAGE], responsible_id: u.uid, comment,
  }).select('id').single()

  // 2) заявка (лид)
  const { data: app } = await supabaseAdmin.from('applications').insert({
    name, contact: phone || telegram, sphere, instagram: telegram,
    source, turnover, status: FIRST_STAGE, responsible: u.name,
  }).select('id').single()
  if (!app) return

  // 3) связать контакт с заявкой
  if (contact) await supabaseAdmin.from('contacts').update({ application_id: app.id }).eq('id', contact.id)

  // 4) история (привязана к контакту → переживёт удаление лида)
  if (comment) await insertHistory('application_comments', { application_id: app.id, contact_id: contact?.id ?? null, body: comment, user_id: u.uid })
  await insertHistory('application_activity', { application_id: app.id, contact_id: contact?.id ?? null, type: 'lead', text: 'Заявка добавлена вручную', user_id: u.uid, user_name: u.name })

  revalidatePath('/admin/applications'); revalidatePath('/admin/contacts')
}

export default async function AdminApplications() {
  const me = await getCurrentUser()
  const isManager = me?.role === 'manager'

  let q = supabaseAdmin.from('applications').select('*').order('created_at', { ascending: false })
  // менеджер видит только заявки, где он ответственный
  if (isManager && me) q = q.eq('responsible', me.name)
  const { data } = await q

  const items: Application[] = (data as Application[]) ?? []

  // индикатор задач для карточек: состояние самой срочной открытой задачи по каждой заявке
  const { data: openTasks } = await supabaseAdmin.from('application_tasks').select('application_id, due_date').eq('done', false)
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const sT = startToday.getTime(); const sTom = sT + 86400000
  const rank: Record<string, number> = { overdue: 0, today: 1, future: 2, has: 3 }
  const taskInfo: Record<number, { state: 'overdue' | 'today' | 'future' | 'has'; due: string | null }> = {}
  for (const t of openTasks ?? []) {
    const aid = t.application_id as number | null
    if (!aid) continue
    const due = (t.due_date as string | null) ?? null
    let st: 'overdue' | 'today' | 'future' | 'has'
    if (!due) st = 'has'
    else { const dt = new Date(due).getTime(); st = dt < sT ? 'overdue' : dt < sTom ? 'today' : 'future' }
    const cur = taskInfo[aid]
    if (!cur || rank[st] < rank[cur.state] || (rank[st] === rank[cur.state] && due && (!cur.due || new Date(due) < new Date(cur.due)))) {
      taskInfo[aid] = { state: st, due }
    }
  }

  // рейтинг недозвонов по сделкам (поля могут отсутствовать до миграции — читаем безопасно)
  const noAnswer: Record<number, { total: number; streak: number }> = {}
  const idList = items.map(i => i.id)
  if (idList.length) {
    const { data: nc } = await supabaseAdmin.from('contacts').select('application_id, no_answer_total, no_answer_streak').in('application_id', idList)
    for (const c of nc ?? []) if (c.application_id) noAnswer[c.application_id as number] = { total: c.no_answer_total ?? 0, streak: c.no_answer_streak ?? 0 }
  }

  const newCount = items.filter(a => a.status === FIRST_STAGE).length
  // выручка считается по выигранным сделкам (клиенты), а общая — по всем
  const totalAmount = items.reduce((s, a) => s + (a.amount ?? 0), 0)
  const wonAmount = items.filter(a => a.status === WON_STAGE).reduce((s, a) => s + (a.amount ?? 0), 0)
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n)

  return (
    <div style={{ maxWidth: 1500 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Заявки</h1>
          <p style={{ fontSize: 13, color: '#8a929c' }}>
            {items.length} сделок{newCount > 0 && <> · <span style={{ color: '#127a98', fontWeight: 600 }}>{newCount} новых</span></>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 22, textAlign: 'right', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8a929c', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Выручка (клиенты)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#127a98' }}>{fmt(wonAmount)} <span style={{ fontSize: 13, color: '#8a929c', fontWeight: 500 }}>сум</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8a929c', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Все сделки</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2329' }}>{fmt(totalAmount)} <span style={{ fontSize: 13, color: '#8a929c', fontWeight: 500 }}>сум</span></div>
          </div>
          <AddDealButton action={createDeal} />
        </div>
      </div>

      <KanbanBoard items={items} setStatus={setStatus} remove={remove} taskInfo={taskInfo} noAnswer={noAnswer} />
    </div>
  )
}
