import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import type { Application, ApplicationComment, ApplicationTask, ApplicationActivity, ApplicationStatus } from '@/lib/supabase'
import ActivityComposer from './ActivityComposer'
import DealFields from './DealFields'
import DealFeed, { type FeedItem } from './DealFeed'
import StatusSelect from './StatusSelect'
import PhoneActions from './PhoneActions'
import CrmTour, { type TourStep } from '@/components/CrmTour'
import { insertHistory } from '@/lib/history'
import { STAGES, STAGE_TITLE, STAGE_COLOR } from '@/lib/stages'

const DEAL_TOUR: TourStep[] = [
  { selector: '[data-tour="d-side"]', title: 'Карточка сделки', text: 'Слева — всё о клиенте: имя, телефон, этап, поля сделки (источник, сфера, оборот, сумма, ответственный).' },
  { selector: '[data-tour="d-phone"]', title: 'Телефон клиента', text: 'Нажми на номер — откроется меню: позвонить, написать в Telegram или WhatsApp, скопировать или отредактировать контакт.' },
  { selector: '[data-tour="d-stage"]', title: 'Этап сделки', text: 'Двигай статус по мере прогресса — кликом по полосе этапов или через выпадающий список. Каждое изменение фиксируется в истории.' },
  { selector: '[data-tour="d-feed"]', title: 'Лента общения', text: 'Вся история по сделке в одном месте: звонки, комментарии и задачи идут по порядку, как в мессенджере. Ничего не теряется.' },
  { selector: '[data-tour="d-composer"]', title: 'Действия по сделке', text: 'Здесь добавляешь комментарий, ставишь задачу-напоминание (с датой) или фиксируешь звонок. Всегда оставляй следующий шаг — задачу.' },
]

const STATUSES = STAGES
const titleOf = (k: string) => STAGE_TITLE[k] ?? k

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// возвращает id связанного контакта; если у заявки контакта нет (веб-заявка) — создаёт его
async function ensureContactForApp(appId: number): Promise<number | null> {
  const { data: ex } = await supabaseAdmin.from('contacts').select('id').eq('application_id', appId).maybeSingle()
  if (ex) return ex.id
  const { data: a } = await supabaseAdmin.from('applications').select('name, contact, instagram, sphere, source, turnover, responsible, status').eq('id', appId).maybeSingle()
  if (!a) return null
  let respId: number | null = null
  if (a.responsible) { const { data: u } = await supabaseAdmin.from('users').select('id').eq('name', a.responsible).maybeSingle(); respId = u?.id ?? null }
  const { data: c } = await supabaseAdmin.from('contacts').insert({
    name: a.name || null, phone: a.contact || null, telegram: a.instagram || null,
    niche: a.sphere || null, source: a.source || null, turnover: a.turnover || null,
    status: STAGE_TITLE[a.status] ?? a.status, application_id: appId, responsible_id: respId,
  }).select('id').single()
  return c?.id ?? null
}

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appId = Number(id)

  const [{ data: appData }, { data: commentsData }, { data: tasksData }, { data: activityData }] = await Promise.all([
    supabaseAdmin.from('applications').select('*').eq('id', appId).single(),
    supabaseAdmin.from('application_comments').select('*').eq('application_id', appId),
    supabaseAdmin.from('application_tasks').select('*').eq('application_id', appId),
    supabaseAdmin.from('application_activity').select('*').eq('application_id', appId),
  ])

  if (!appData) notFound()
  const app = appData as Application

  // связанный контакт из базы — к нему «приклеиваем» историю, чтобы она пережила удаление лида
  const { data: linkedContact } = await supabaseAdmin.from('contacts').select('id').eq('application_id', appId).maybeSingle()
  const linkedContactId: number | null = linkedContact?.id ?? null

  // рейтинг недозвонов (поля могут отсутствовать до миграции — читаем безопасно)
  let noAns = { total: 0, streak: 0 }
  if (linkedContactId) {
    const { data: na } = await supabaseAdmin.from('contacts').select('no_answer_total, no_answer_streak').eq('id', linkedContactId).maybeSingle()
    if (na) noAns = { total: na.no_answer_total ?? 0, streak: na.no_answer_streak ?? 0 }
  }

  // менеджер может открывать только свои сделки
  const me = await getCurrentUser()
  if (me?.role === 'manager' && app.responsible !== me.name) redirect('/admin/applications')
  const comments = (commentsData as ApplicationComment[]) ?? []
  const tasks = (tasksData as ApplicationTask[]) ?? []
  const activity = (activityData as ApplicationActivity[]) ?? []
  const tags = app.tags ?? []

  // список ответственных — реальные активные пользователи (+ текущий, если задан)
  const { data: usersData } = await supabaseAdmin.from('users').select('id, name').eq('status', 'active').order('name')
  const team = Array.from(new Set([...(usersData?.map(u => u.name as string) ?? []), app.responsible].filter(Boolean))) as string[]
  const userName = new Map((usersData ?? []).map(u => [u.id as number, u.name as string]))

  // ── Server actions ──────────────────────────────────────────────
  async function deleteDeal() {
    'use server'
    // история с привязкой к контакту переживёт удаление (FK → set null);
    // «сиротские» записи без контакта чистим, чтобы не копились
    await supabaseAdmin.from('application_comments').delete().eq('application_id', appId).is('contact_id', null)
    await supabaseAdmin.from('application_tasks').delete().eq('application_id', appId).is('contact_id', null)
    await supabaseAdmin.from('application_activity').delete().eq('application_id', appId).is('contact_id', null)
    await supabaseAdmin.from('applications').delete().eq('id', appId)
    revalidatePath('/admin/applications')
    redirect('/admin/applications')
  }
  async function changeStatus(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const status = formData.get('status') as ApplicationStatus
    if (status && status !== app.status) {
      await supabaseAdmin.from('applications').update({ status }).eq('id', appId)
      // синхронизация: статус привязанного контакта = этап сделки
      await supabaseAdmin.from('contacts').update({ status: titleOf(status) }).eq('application_id', appId)
      await insertHistory('application_activity', {
        application_id: appId, contact_id: linkedContactId, type: 'stage',
        text: `Этап: ${titleOf(app.status)} → ${titleOf(status)}`,
        user_id: u?.uid ?? null, user_name: u?.name ?? null,
      })
    }
    revalidatePath(`/admin/applications/${appId}`); revalidatePath('/admin/applications'); revalidatePath('/admin/contacts')
  }
  async function logCall(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const result = (formData.get('result') as string || '').trim()
    await insertHistory('application_activity', {
      application_id: appId, contact_id: linkedContactId, type: 'call',
      text: result ? `Дозвон: ${result}` : 'Дозвон',
      user_id: u?.uid ?? null, user_name: u?.name ?? null,
    })
    revalidatePath(`/admin/applications/${appId}`)
  }
  // не ответил/игнор: +1 к общему и к серии; 5 подряд → авто-отказ
  async function markNoAnswer() {
    'use server'
    const u = await getCurrentUser()
    const cid = await ensureContactForApp(appId)
    if (!cid) return
    const { data: c } = await supabaseAdmin.from('contacts').select('no_answer_total, no_answer_streak').eq('id', cid).maybeSingle()
    const total = (c?.no_answer_total ?? 0) + 1
    const streak = (c?.no_answer_streak ?? 0) + 1
    await supabaseAdmin.from('contacts').update({ no_answer_total: total, no_answer_streak: streak }).eq('id', cid)
    await insertHistory('application_activity', { application_id: appId, contact_id: cid, type: 'call', text: `🔕 Нет ответа (подряд ${streak})`, user_id: u?.uid ?? null, user_name: u?.name ?? null })
    if (streak >= 5 && app.status !== 'rejected') {
      await supabaseAdmin.from('applications').update({ status: 'rejected' }).eq('id', appId)
      await supabaseAdmin.from('contacts').update({ status: titleOf('rejected') }).eq('id', cid)
      await insertHistory('application_activity', { application_id: appId, contact_id: cid, type: 'stage', text: `Автоотказ: 5 раз подряд без ответа → ${titleOf('rejected')}`, user_id: u?.uid ?? null, user_name: u?.name ?? null })
    } else {
      // автозадача «Связаться» на завтра — чтобы контакт не потерялся
      const due = new Date(); due.setDate(due.getDate() + 1); due.setHours(11, 0, 0, 0)
      await insertHistory('application_tasks', { application_id: appId, contact_id: cid, title: 'Связаться (нет ответа)', due_date: due.toISOString(), user_id: u?.uid ?? null })
    }
    revalidatePath(`/admin/applications/${appId}`); revalidatePath('/admin/applications'); revalidatePath('/admin/contacts')
  }
  // дозвонился — серия недозвонов обнуляется
  async function markReached() {
    'use server'
    const u = await getCurrentUser()
    const cid = await ensureContactForApp(appId)
    if (!cid) return
    await supabaseAdmin.from('contacts').update({ no_answer_streak: 0 }).eq('id', cid)
    await insertHistory('application_activity', { application_id: appId, contact_id: cid, type: 'call', text: '✅ Ответил', user_id: u?.uid ?? null, user_name: u?.name ?? null })
    revalidatePath(`/admin/applications/${appId}`); revalidatePath('/admin/applications'); revalidatePath('/admin/contacts')
  }
  async function saveContact(formData: FormData) {
    'use server'
    const contact = ((formData.get('contact') as string) ?? '').trim()
    await supabaseAdmin.from('applications').update({ contact: contact || null }).eq('id', appId)
    revalidatePath(`/admin/applications/${appId}`); revalidatePath('/admin/applications')
  }
  async function saveDeal(formData: FormData): Promise<{ ok: boolean; error?: string }> {
    'use server'
    const g = (k: string) => ((formData.get(k) as string) ?? '').trim()
    const amount = Number(g('amount').replace(/\D/g, '')) || 0
    const { error } = await supabaseAdmin.from('applications').update({
      name:       g('name') || null,
      responsible: g('responsible') || null,
      amount,
      is_owner:   g('is_owner') || null,
      profit:     g('profit') || null,
      sphere:     g('sphere') || null,
      instagram:  g('instagram') || null,
      motivation: g('motivation') || null,
      source:     g('source') || null,
      turnover:   g('turnover') || null,
    }).eq('id', appId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/applications/${appId}`); revalidatePath('/admin/applications')
    return { ok: true }
  }
  async function addTag(formData: FormData) {
    'use server'
    const t = (formData.get('tag') as string || '').trim()
    if (!t) return
    const next = Array.from(new Set([...(app.tags ?? []), t]))
    await supabaseAdmin.from('applications').update({ tags: next }).eq('id', appId)
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function removeTag(tag: string) {
    'use server'
    const next = (app.tags ?? []).filter(t => t !== tag)
    await supabaseAdmin.from('applications').update({ tags: next }).eq('id', appId)
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function addComment(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const body = (formData.get('body') as string || '').trim()
    if (!body) return
    await insertHistory('application_comments', { application_id: appId, contact_id: linkedContactId, body, user_id: u?.uid ?? null })
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function delComment(cid: number) {
    'use server'
    await supabaseAdmin.from('application_comments').delete().eq('id', cid)
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function addTask(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    const title = (formData.get('title') as string || '').trim()
    if (!title) return
    const due = (formData.get('due_date') as string) || null
    await insertHistory('application_tasks', { application_id: appId, contact_id: linkedContactId, title, due_date: due, user_id: u?.uid ?? null })
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function toggleTask(tid: number, done: boolean) {
    'use server'
    await supabaseAdmin.from('application_tasks').update({ done }).eq('id', tid)
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function completeTask(tid: number, formData: FormData) {
    'use server'
    const result = ((formData.get('result') as string) ?? '').trim() || null
    const { error } = await supabaseAdmin.from('application_tasks').update({ done: true, result }).eq('id', tid)
    if (error && /result/i.test(error.message)) await supabaseAdmin.from('application_tasks').update({ done: true }).eq('id', tid)
    revalidatePath(`/admin/applications/${appId}`)
  }
  async function delTask(tid: number) {
    'use server'
    await supabaseAdmin.from('application_tasks').delete().eq('id', tid)
    revalidatePath(`/admin/applications/${appId}`)
  }

  const daysSince = app.created_at ? Math.max(0, Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86400000)) : 0

  // ── Сборка единой ленты ─────────────────────────────────────────
  const t = (s?: string) => s ? new Date(s).getTime() : 0
  const feed: FeedItem[] = [
    ...(app.created_at ? [{ kind: 'created' as const, at: t(app.created_at) }] : []),
    ...activity.map(a => ({ kind: (['stage', 'call', 'lead'].includes(a.type) ? a.type : 'system') as 'stage' | 'system' | 'call' | 'lead', at: t(a.created_at), text: a.text, who: a.user_name })),
    ...comments.map(c => ({ kind: 'note' as const, at: t(c.created_at), id: c.id, body: c.body, who: c.user_id ? userName.get(c.user_id) ?? null : null })),
    ...tasks.map(tk => ({ kind: 'task' as const, at: t(tk.created_at), id: tk.id, title: tk.title, done: tk.done, due: tk.due_date, result: tk.result ?? null, who: tk.user_id ? userName.get(tk.user_id) ?? null : null })),
  ]

  return (
    <div style={{ maxWidth: 1320, marginLeft: -32 }} className="deal-root">
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14, alignItems: 'start' }} className="deal-grid">

        {/* ── Левая колонка — светлый сайдбар ── */}
        <div data-tour="d-side" className="deal-side" style={{
          background: '#fff', border: '1px solid #e4e7ec', borderRadius: 16, padding: '20px 22px', color: '#1f2329',
          boxShadow: '0 1px 3px rgba(16,24,40,0.05)',
          position: 'sticky', top: 16, maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
        }}>
          {/* шапка */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Link href="/admin/applications" title="Все заявки" style={{ fontSize: 22, color: '#aab2bd', textDecoration: 'none', lineHeight: 1, marginTop: -2 }}>‹</Link>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2329', lineHeight: 1.2, flex: 1 }}>{app.name || 'Без имени'}</h1>
          </div>

          {/* телефон с действиями */}
          {app.contact && (
            <div data-tour="d-phone" style={{ marginBottom: 12 }}>
              <PhoneActions phone={app.contact} telegram={app.instagram} saveContact={saveContact} />
            </div>
          )}

          {/* Нет ответа — рейтинг контакта (звонок или Telegram) */}
          <div style={{ marginBottom: 14, background: '#f7f8fa', border: '1px solid #eef0f3', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8a929c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Нет ответа</span>
              <span style={{ fontSize: 12, color: '#5b6470' }}>
                всего <b style={{ color: '#1f2329' }}>{noAns.total}</b> · подряд <b style={{ color: noAns.streak >= 4 ? '#d24a3d' : noAns.streak > 0 ? '#b87613' : '#1f2329' }}>{noAns.streak}</b>/5
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <form action={markNoAnswer} style={{ flex: 1 }}>
                <button type="submit" style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid #f0c9c4', background: '#fff', color: '#d24a3d', fontFamily: 'inherit' }}>🔕 Нет ответа</button>
              </form>
              <form action={markReached} style={{ flex: 1 }}>
                <button type="submit" style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid #cfe9f3', background: '#f4faf6', color: '#127a98', fontFamily: 'inherit' }}>✅ Ответил</button>
              </form>
            </div>
            {noAns.streak === 4 && <div style={{ fontSize: 11, color: '#d24a3d', marginTop: 7, fontWeight: 600 }}>Ещё 1 раз без ответа — автоотказ</div>}
          </div>

          {/* id + теги */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#aab2bd' }}>#{app.id}</span>
            {tags.map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#127a98', background: 'rgba(30,170,209,0.1)', border: '1px solid rgba(30,170,209,0.25)', borderRadius: 5, padding: '2px 7px' }}>
                #{tag}
                <form action={removeTag.bind(null, tag)} style={{ display: 'inline' }}>
                  <button type="submit" style={{ background: 'none', border: 'none', color: '#127a98', cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>
                </form>
              </span>
            ))}
            <form action={addTag} style={{ display: 'inline-flex' }}>
              <input name="tag" placeholder="#тег" style={{ width: 74, padding: '3px 8px', fontSize: 11, background: '#fff', border: '1px solid #d7dce3', borderRadius: 5, color: '#1f2329', outline: 'none' }} />
            </form>
          </div>

          {/* полоса этапов «Прогрев» */}
          <div data-tour="d-stage" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Прогрев</span>
              <span style={{ fontSize: 12, color: '#8a929c' }}>{daysSince} дн.</span>
            </div>
            <StageBar statuses={STATUSES.map(s => ({ key: s.key, title: s.title }))} current={app.status} action={changeStatus} />
            <div style={{ marginTop: 10 }}>
              <StatusSelect value={app.status} color={STATUSES.find(s => s.key === app.status)?.color ?? '#1EAAD1'} statuses={STATUSES.map(s => ({ key: s.key, title: s.title }))} action={changeStatus} />
            </div>
          </div>

          {/* вкладки (Основное активна) */}
          <div style={{ display: 'flex', gap: 18, borderBottom: '1px solid #eef0f3', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2329', paddingBottom: 9, borderBottom: '2px solid #1EAAD1' }}>Основное</span>
            <span style={{ fontSize: 13, color: '#aab2bd', paddingBottom: 9 }}>Статистика</span>
            <span style={{ fontSize: 13, color: '#aab2bd', paddingBottom: 9 }}>Файлы</span>
          </div>

          {/* поля */}
          <DealFields app={app} team={team} action={saveDeal} />

          {/* низ: создана + удалить */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f2f4f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8a929c' }}>Создана {fmtDate(app.created_at)}</span>
            <form action={deleteDeal}>
              <button type="submit" style={{ background: 'none', border: 'none', color: '#d24a3d', cursor: 'pointer', fontSize: 12 }}>Удалить</button>
            </form>
          </div>
        </div>

        {/* ── Правая колонка — лента-мессенджер ── */}
        <div data-tour="d-feed" style={{ position: 'sticky', top: 16, height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }} className="deal-feed-col">
          <DealFeed items={feed} delComment={delComment} toggleTask={toggleTask} completeTask={completeTask} delTask={delTask} />
          <div data-tour="d-composer">
            <ActivityComposer addComment={addComment} addTask={addTask} logCall={logCall} responsible={app.responsible} />
          </div>
        </div>
      </div>

      <style>{`
        .deal-side::-webkit-scrollbar { width: 8px; }
        .deal-side::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); border-radius: 4px; }
        .deal-side::-webkit-scrollbar-track { background: transparent; }
        @media(max-width: 860px){
          .deal-root { margin-left: 0 !important; }
          .deal-grid { grid-template-columns: 1fr !important; }
          .deal-side { position: static !important; max-height: none !important; }
          .deal-feed-col { position: static !important; height: auto !important; }
        }
      `}</style>

      <CrmTour steps={DEAL_TOUR} storageKey="pbc_deal_tour_v1" buttonLabel="Обучение" />
    </div>
  )
}

function StageBar({ statuses, current, action }: { statuses: { key: string; title: string }[]; current: string; action: (fd: FormData) => Promise<void> }) {
  const idx = statuses.findIndex(s => s.key === current)
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {statuses.map((s, i) => {
        const filled = i <= idx
        const col = STAGE_COLOR[s.key] ?? '#5b9bd5'
        return (
          <form key={s.key} action={action} style={{ flex: 1, display: 'flex' }}>
            <button type="submit" name="status" value={s.key} title={s.title}
              style={{
                flex: 1, height: 22, border: 'none', cursor: 'pointer', padding: 0,
                background: filled ? col : '#e9edf1',
                borderTopLeftRadius: i === 0 ? 6 : 0, borderBottomLeftRadius: i === 0 ? 6 : 0,
                borderTopRightRadius: i === statuses.length - 1 ? 6 : 0, borderBottomRightRadius: i === statuses.length - 1 ? 6 : 0,
              }} />
          </form>
        )
      })}
    </div>
  )
}

