import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import type { Contact, User } from '@/lib/supabase'
import AssignSelect from './AssignSelect'
import ContactStatusSelect from './ContactStatusSelect'
import BulkBar from './BulkBar'
import CrmTour, { type TourStep } from '@/components/CrmTour'
import { insertHistory } from '@/lib/history'
import { CONTACT_STATUSES, STAGE_TITLE, FIRST_STAGE, stageKeyForStatus } from '@/lib/stages'

const BASE_TOUR: TourStep[] = [
  { selector: '[data-tour="c-filters"]', title: 'Поиск и фильтры', text: 'Находи контакты по имени, телефону или Telegram. Фильтруй по статусу, источнику, ответственному — и работай только со своим списком.' },
  { selector: '[data-tour="c-status"]', title: 'Статус контакта', text: 'Меняй статус прямо в таблице после каждого звонка: Перезвонить, Нет ответа, На проверке и т.д. Так база всегда в актуальном состоянии.' },
  { selector: '[data-tour="c-work"]', title: 'Кнопка «В работу»', text: 'Если контакт подходит по критериям и заинтересован — жми «В работу». Из контакта заведётся сделка (лид) в разделе «Заявки», и ты ведёшь его дальше по воронке.' },
  { title: 'Как работать с базой', text: 'Двигайся по списку сверху вниз: звони, сразу меняй статус и пиши комментарий. Подходящих переводи «В работу», остальных — в нужный статус. Ничего не теряется.' },
]

const PER_PAGE = 50
const STATUSES = CONTACT_STATUSES // единый список: префаза + этапы воронки
const SOURCES = ['pro_business_club', 'prostartclub', 'офлайн_разборы', 'таргетруслан', 'startupclub']

async function del(id: number) {
  'use server'
  await supabaseAdmin.from('contacts').delete().eq('id', id)
  revalidatePath('/admin/contacts')
}
async function save(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const g = (k: string) => (formData.get(k) as string)?.trim() || null
  await supabaseAdmin.from('contacts').update({
    name: g('name'), phone: g('phone'), telegram: g('telegram'),
    niche: g('niche'), status: g('status'), turnover: g('turnover'),
    comment: g('comment'), source: g('source'),
  }).eq('id', id)
  revalidatePath('/admin/contacts')
}

async function setContactStatus(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const status = (formData.get('status') as string)?.trim() || null
  if (!id) return
  const { data: cur } = await supabaseAdmin.from('contacts').select('application_id').eq('id', id).single()
  await supabaseAdmin.from('contacts').update({ status }).eq('id', id)
  // синхронизация: если статус = этап воронки и есть сделка — двигаем и сделку
  const key = stageKeyForStatus(status)
  if (key && cur?.application_id) {
    await supabaseAdmin.from('applications').update({ status: key }).eq('id', cur.application_id)
    revalidatePath(`/admin/applications/${cur.application_id}`); revalidatePath('/admin/applications')
  }
  revalidatePath('/admin/contacts')
}

async function assignResponsible(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const rid = formData.get('responsible_id') as string
  await supabaseAdmin.from('contacts').update({ responsible_id: rid ? Number(rid) : null }).eq('id', id)
  revalidatePath('/admin/contacts')
}

async function bulkAssign(ids: number[], responsibleId: number | null) {
  'use server'
  if (!ids?.length) return
  await supabaseAdmin.from('contacts').update({ responsible_id: responsibleId }).in('id', ids)
  revalidatePath('/admin/contacts')
}

// Выдать менеджеру N свободных контактов (без ответственного и не в работе)
async function handout(formData: FormData) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  const managerId = Number(formData.get('manager_id'))
  const count = Math.min(500, Math.max(1, Number(formData.get('count') || 0)))
  if (!managerId || !count) return
  const { data: free } = await supabaseAdmin.from('contacts')
    .select('id')
    .is('responsible_id', null)
    .is('application_id', null)
    .order('id', { ascending: true })
    .limit(count)
  const ids = (free ?? []).map((c: { id: number }) => c.id)
  if (ids.length) await supabaseAdmin.from('contacts').update({ responsible_id: managerId }).in('id', ids)
  revalidatePath('/admin/contacts')
}

// Перенести контакт в заявки (создать лид, пометить контакт «в работе»)
async function moveToLead(id: number) {
  'use server'
  const { data: c } = await supabaseAdmin.from('contacts').select('*').eq('id', id).single()
  if (!c || c.application_id) return // уже в работе
  const tags = (c.source || '').split(';').map((s: string) => s.trim()).filter(Boolean)
  // ответственный контакта → ответственный сделки
  let respName: string | null = null
  if (c.responsible_id) {
    const { data: u } = await supabaseAdmin.from('users').select('name').eq('id', c.responsible_id).single()
    respName = u?.name ?? null
  }
  const { data: app } = await supabaseAdmin.from('applications').insert({
    name: c.name || null,
    contact: c.phone || c.telegram || null,
    sphere: c.niche || null,
    instagram: c.telegram || null,
    source: c.source || null,
    turnover: c.turnover || null,
    status: 'primary',
    responsible: respName,
    tags,
  }).select('id').single()
  if (!app) return
  const u = await getCurrentUser()
  // комментарий из базы → первая заметка (привязка к контакту → переживёт удаление лида)
  if (c.comment) await insertHistory('application_comments', { application_id: app.id, contact_id: id, body: c.comment, user_id: u?.uid ?? null })
  await insertHistory('application_activity', { application_id: app.id, contact_id: id, type: 'lead', text: 'Перенесён из базы контактов', user_id: u?.uid ?? null, user_name: u?.name ?? null })
  // статус контакта = этап новой сделки (единый статус)
  await supabaseAdmin.from('contacts').update({ application_id: app.id, status: STAGE_TITLE[FIRST_STAGE] }).eq('id', id)
  revalidatePath('/admin/contacts'); revalidatePath('/admin/applications')
}

type SP = { q?: string; status?: string; source?: string; dup?: string; work?: string; resp?: string; sort?: string; page?: string; edit?: string; deal?: string }

export default async function AdminContacts({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await getCurrentUser()
  const isManager = me?.role === 'manager'
  const canAssign = me?.role === 'admin' || me?.role === 'administrator'

  const { data: usersData } = await supabaseAdmin.from('users').select('id, name').eq('status', 'active').order('name')
  const users = (usersData as Pick<User, 'id' | 'name'>[]) ?? []
  const userName = new Map(users.map(u => [u.id, u.name]))

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const q = (sp.q || '').trim()
  const status = sp.status || ''
  const source = sp.source || ''
  const dup = sp.dup === '1'
  const work = sp.work || ''
  const resp = sp.resp || ''
  const sort = sp.sort || ''
  const byPhone = sort === 'phone'

  let query = supabaseAdmin.from('contacts').select('*', { count: 'exact' })
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,telegram.ilike.%${q}%`)
  if (status) query = query.eq('status', status)
  if (source) query = query.ilike('source', `%${source}%`)
  if (dup) query = query.eq('is_duplicate', true)
  if (work === 'free') query = query.is('application_id', null)
  if (work === 'taken') query = query.not('application_id', 'is', null)
  // менеджер видит только свои контакты; админ/администратор — все (+ фильтр)
  if (isManager && me) query = query.eq('responsible_id', me.uid)
  else if (resp) query = query.eq('responsible_id', Number(resp))
  query = byPhone
    ? query.order('phone', { ascending: true, nullsFirst: false }).order('id', { ascending: true }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
    : query.order('id', { ascending: true }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const { data, count } = await query
  // сколько контактов свободно (для выдачи менеджерам)
  let freeCount = 0
  if (canAssign) {
    const { count: fc } = await supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }).is('responsible_id', null).is('application_id', null)
    freeCount = fc ?? 0
  }
  const contacts = (data as Contact[]) ?? []
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const editItem = sp.edit ? contacts.find(c => c.id === Number(sp.edit)) : null

  // ссылка с сохранением фильтров
  const qs = (over: Partial<SP>) => {
    const p = new URLSearchParams()
    const merged = { q, status, source, dup: dup ? '1' : '', work, resp, sort, page: String(page), ...over }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v))
    return '/admin/contacts?' + p.toString()
  }

  // парность групп по телефону (для подсветки) при сортировке дублей
  const groupBg = new Map<number, boolean>()
  if (byPhone) {
    let prev: string | null = null
    let parity = false
    for (const c of contacts) {
      if (c.phone !== prev) { parity = !parity; prev = c.phone ?? null }
      groupBg.set(c.id, parity)
    }
  }

  return (
    <div style={{ maxWidth: 1430, marginLeft: -28 }} className="base-root">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>База контактов</h1>
        <p style={{ fontSize: 13, color: '#8a929c' }}>Найдено: {total.toLocaleString('ru-RU')}</p>
      </div>

      {/* Фильтры */}
      <form data-tour="c-filters" method="get" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <input name="q" defaultValue={q} placeholder="Поиск: имя, телефон, telegram" className="admin-input" style={{ maxWidth: 300 }} />
        <select name="status" defaultValue={status} className="admin-input" style={{ maxWidth: 180 }}>
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="source" defaultValue={source} className="admin-input" style={{ maxWidth: 180 }}>
          <option value="">Все источники</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="work" defaultValue={work} className="admin-input" style={{ maxWidth: 160 }}>
          <option value="">Все (работа)</option>
          <option value="free">Свободные</option>
          <option value="taken">В работе</option>
        </select>
        {canAssign && (
          <select name="resp" defaultValue={resp} className="admin-input" style={{ maxWidth: 180 }}>
            <option value="">Все ответственные</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#5b6470', cursor: 'pointer' }}>
          <input type="checkbox" name="dup" value="1" defaultChecked={dup} style={{ width: 15, height: 15, accentColor: '#1EAAD1' }} />
          Только дубли
        </label>
        <input type="hidden" name="sort" value={sort} />
        <button type="submit" className="admin-btn-primary" style={{ padding: '9px 20px' }}>Фильтр</button>
        <Link href="/admin/contacts" className="admin-btn-ghost">Сброс</Link>
      </form>

      {/* Группировка дублей */}
      <div style={{ marginBottom: 16 }}>
        {byPhone ? (
          <Link href={qs({ sort: '', dup: dup ? '1' : '', page: '1' })} className="admin-btn-ghost" style={{ borderColor: '#1EAAD1', color: '#127a98' }}>
            ✓ Дубли сгруппированы · обычный вид
          </Link>
        ) : (
          <Link href={qs({ sort: 'phone', dup: '1', page: '1' })} className="admin-btn-primary" style={{ padding: '9px 18px' }}>
            ⇅ Сгруппировать дубли
          </Link>
        )}
        {byPhone && <span style={{ marginLeft: 12, fontSize: 12, color: '#8a929c' }}>записи с одинаковым телефоном идут подряд и подсвечены группами</span>}
      </div>

      {editItem && <EditForm c={editItem} save={save} backHref={qs({ edit: '' })} />}

      {/* Выдать менеджеру пачку свободных контактов */}
      {canAssign && (
        <form action={handout} className="admin-card" style={{ padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2329' }}>Выдать базу для обзвона:</span>
          <select name="manager_id" required defaultValue="" className="admin-input" style={{ maxWidth: 200, padding: '8px 11px' }}>
            <option value="" disabled>Кому (менеджер)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input name="count" type="number" min={1} max={500} defaultValue={20} className="admin-input" style={{ maxWidth: 90, padding: '8px 11px' }} />
          <span style={{ fontSize: 13, color: '#8a929c' }}>контактов</span>
          <button type="submit" className="admin-btn-primary" style={{ padding: '9px 20px' }}>Выдать</button>
          <span style={{ fontSize: 12, color: freeCount ? '#127a98' : '#d24a3d', marginLeft: 'auto' }}>
            Свободно: <b>{freeCount.toLocaleString('ru-RU')}</b>
          </span>
        </form>
      )}

      {/* Массовое назначение (админ/администратор) */}
      {canAssign && <BulkBar users={users} action={bulkAssign} />}

      {/* Таблица */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f8fa', textAlign: 'left' }}>
                {canAssign && <th style={{ padding: '11px 14px', borderBottom: '1px solid #eef0f3', width: 34 }}></th>}
                {['Имя', 'Телефон', 'Telegram', 'Статус', 'Источник', 'Ниша', 'Комментарий', 'Ответственный', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontWeight: 600, color: '#8a929c', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef0f3' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f2f4f7', background: byPhone ? (groupBg.get(c.id) ? '#fff' : '#f4faf6') : undefined }}>
                  {canAssign && <td style={{ padding: '10px 14px' }}><input type="checkbox" className="contact-check" value={c.id} style={{ width: 15, height: 15, accentColor: '#1EAAD1', cursor: 'pointer' }} /></td>}
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1f2329', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/contacts/${c.id}`} style={{ color: '#1f2329', textDecoration: 'none' }} title="Открыть карточку и историю">{c.name || '—'}</Link>
                    {c.is_duplicate && <span title="Дубль по телефону" style={{ marginLeft: 6, fontSize: 10, color: '#b87613', background: 'rgba(240,160,32,0.12)', borderRadius: 4, padding: '1px 6px' }}>дубль</span>}
                    {c.application_id && <span title="Перенесён в заявки" style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#127a98', background: 'rgba(30,170,209,0.1)', border: '1px solid rgba(30,170,209,0.25)', borderRadius: 4, padding: '1px 6px' }}>в работе</span>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#127a98', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#5b6470', whiteSpace: 'nowrap' }}>{c.telegram || ''}</td>
                  <td data-tour="c-status" style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><ContactStatusSelect contactId={c.id} value={c.status} statuses={STATUSES} action={setContactStatus} /></td>
                  <td style={{ padding: '10px 14px', color: '#8a929c', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.source || ''}>{c.source || ''}</td>
                  <td style={{ padding: '10px 14px', color: '#5b6470', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.niche || ''}>{c.niche || ''}</td>
                  <td style={{ padding: '10px 14px', color: '#8a929c', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.comment || ''}>{c.comment || ''}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {canAssign
                      ? <AssignSelect contactId={c.id} value={c.responsible_id} users={users} action={assignResponsible} />
                      : <span style={{ fontSize: 13, color: '#5b6470' }}>{c.responsible_id ? userName.get(c.responsible_id) : '—'}</span>}
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.application_id ? (
                        <Link href={`/admin/applications/${c.application_id}`} className="admin-btn-ghost" style={{ fontSize: 11, padding: '5px 10px', borderColor: '#bfe9d2', color: '#127a98' }}>Открыть лид</Link>
                      ) : (
                        <form data-tour="c-work" action={moveToLead.bind(null, c.id)}>
                          <button type="submit" className="admin-btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}>В работу</button>
                        </form>
                      )}
                      <form action={del.bind(null, c.id)}><button type="submit" className="admin-btn-danger" style={{ fontSize: 11, padding: '5px 9px' }}>✕</button></form>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={canAssign ? 10 : 9} style={{ padding: '48px', textAlign: 'center', color: '#aab2bd' }}>Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, justifyContent: 'center' }}>
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="admin-btn-ghost">← Назад</Link>}
          <span style={{ fontSize: 13, color: '#8a929c' }}>Стр. {page} из {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="admin-btn-ghost">Вперёд →</Link>}
        </div>
      )}

      <CrmTour steps={BASE_TOUR} storageKey="pbc_base_tour_v1" buttonLabel="Обучение" />
      <style>{`@media(max-width:860px){ .base-root{ margin-left: 0 !important; } }`}</style>
    </div>
  )
}

function StatusBadge({ s }: { s?: string }) {
  if (!s) return <span style={{ color: '#c2c8d0' }}>—</span>
  const map: Record<string, [string, string]> = {
    'Новый': ['#127a98', 'rgba(30,170,209,0.1)'],
    'Перезвонить': ['#b87613', 'rgba(240,160,32,0.12)'],
    'На проверке': ['#3a7bd5', 'rgba(58,123,213,0.1)'],
    'Отказ': ['#d24a3d', 'rgba(210,74,61,0.1)'],
    'Не подходит': ['#8a929c', '#f0f2f5'],
    'Спам': ['#8a929c', '#f0f2f5'],
    'Нет ответа': ['#8a929c', '#eef0f3'],
  }
  const [color, bg] = map[s] || ['#5b6470', '#eef0f3']
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap' }}>{s}</span>
}

function EditForm({ c, save, backHref }: { c: Contact; save: (fd: FormData) => Promise<void>; backHref: string }) {
  const inp = { width: '100%', padding: '8px 11px', fontSize: 13.5, border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff' } as React.CSSProperties
  return (
    <form action={save} className="form-panel" style={{ marginBottom: 20 }}>
      <input type="hidden" name="id" value={c.id} />
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2329', marginBottom: 16 }}>Редактировать контакт</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <div><label className="admin-label">Имя</label><input name="name" defaultValue={c.name ?? ''} style={inp} /></div>
        <div><label className="admin-label">Телефон</label><input name="phone" defaultValue={c.phone ?? ''} style={inp} /></div>
        <div><label className="admin-label">Telegram</label><input name="telegram" defaultValue={c.telegram ?? ''} style={inp} /></div>
        <div><label className="admin-label">Статус</label>
          <select name="status" defaultValue={c.status ?? ''} style={inp}>
            <option value="">—</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="admin-label">Ниша</label><input name="niche" defaultValue={c.niche ?? ''} style={inp} /></div>
        <div><label className="admin-label">Оборот</label><input name="turnover" defaultValue={c.turnover ?? ''} style={inp} /></div>
      </div>
      <div style={{ marginBottom: 12 }}><label className="admin-label">Источник</label><input name="source" defaultValue={c.source ?? ''} style={inp} /></div>
      <div style={{ marginBottom: 16 }}><label className="admin-label">Комментарий</label><textarea name="comment" defaultValue={c.comment ?? ''} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px' }}>Сохранить</button>
        <Link href={backHref} className="admin-btn-ghost">Отмена</Link>
      </div>
    </form>
  )
}
