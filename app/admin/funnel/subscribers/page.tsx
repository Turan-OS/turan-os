import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import { STAGE_TITLE, FIRST_STAGE } from '@/lib/stages'
import { insertHistory } from '@/lib/history'
import { classifyChannel } from '@/lib/attribution'
import { getDefaultResponsible } from '@/lib/settings'
import ConfirmSubmit from './ConfirmSubmit'

const PER_PAGE = 50
// номера страниц с многоточиями: 1 … cur-1 cur cur+1 … last
function pageNums(cur: number, total: number): (number | '…')[] {
  const set = new Set<number>([1, total, cur, cur - 1, cur + 1])
  const arr = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const n of arr) { if (n - prev > 1) out.push('…'); out.push(n); prev = n }
  return out
}

// Сброс прогресса подписчика: цепочка пойдёт заново (следующий тик воркера
// отправит первый шаг). Обнуляем все подписки этого chat_id.
async function resetSubscriber(chatId: number) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  await supabaseAdmin.from('broadcast_subscribers')
    .update({ current_step: 0, status: 'active', next_send_at: new Date().toISOString() })
    .eq('chat_id', chatId)
  revalidatePath('/admin/funnel/subscribers')
}

// Удалить подписчика из списка (например, отписавшегося) — вместе с его прогрессом воронки.
async function deleteSubscriber(chatId: number) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  await supabaseAdmin.from('broadcast_subscribers').delete().eq('chat_id', chatId)
  await supabaseAdmin.from('bot_users').delete().eq('chat_id', chatId)
  revalidatePath('/admin/funnel/subscribers')
}

// Перенести подписчика в «Заявки» как холодный лид из воронки (менеджер сможет работать).
async function createDealFromSubscriber(chatId: number) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  const { data: bu } = await supabaseAdmin.from('bot_users').select('*').eq('chat_id', chatId).maybeSingle()
  if (!bu) return
  // не дублируем — если по этому подписчику заявка уже есть
  const { data: exist } = await supabaseAdmin.from('applications').select('id').eq('tg_chat_id', chatId).limit(1)
  if (exist && exist.length) { revalidatePath('/admin/funnel/subscribers'); return }

  const name = [bu.first_name, bu.last_name].filter(Boolean).join(' ') || (bu.username ? '@' + bu.username : `id ${chatId}`)
  const tgHandle = bu.username ? '@' + bu.username : null
  const phone = bu.phone || null
  const channel = classifyChannel(bu, true)     // источник подписчика; из воронки → минимум «Воронка»
  const source = 'Воронка (холодный)'           // пометка: НЕ с сайта, лид холоднее
  const defResp = await getDefaultResponsible()  // ответственный по умолчанию (Настройки → План)

  // 1) контакт в базе
  const { data: contact } = await supabaseAdmin.from('contacts').insert({
    name, phone, telegram: bu.username || null, source,
    status: STAGE_TITLE[FIRST_STAGE], responsible_id: defResp?.id ?? null,
  }).select('id').single()

  // 2) заявка (холодная, из воронки) — ник в поле Telegram, не в Инстаграм
  const { data: app } = await supabaseAdmin.from('applications').insert({
    name, contact: phone || tgHandle, telegram: bu.username || null,
    source, status: FIRST_STAGE, tg_chat_id: chatId, channel, responsible: defResp?.name ?? null,
    utm_source: bu.utm_source ?? null, utm_medium: bu.utm_medium ?? null, utm_campaign: bu.utm_campaign ?? null,
    tags: ['холодный', 'воронка'],
  }).select('id').single()
  if (!app) return

  if (contact) await supabaseAdmin.from('contacts').update({ application_id: app.id }).eq('id', contact.id)
  await insertHistory('application_activity', {
    application_id: app.id, contact_id: contact?.id ?? null, type: 'lead',
    text: 'Перенесён из подписчиков воронки (холодный лид)', user_id: me.uid, user_name: me.name,
  })
  revalidatePath('/admin/funnel/subscribers')
  revalidatePath('/admin/applications')
}

type BotUser = {
  id: number; chat_id: number; username: string | null
  first_name: string | null; last_name: string | null
  phone: string | null; bot_id: number | null
  subscribed_at: string | null; last_seen: string | null
}
type Sub = { chat_id: number; broadcast_id: number; status: string | null; current_step: number | null }

const fmt = (s?: string | null) => {
  if (!s) return ''
  const d = new Date(s), now = Date.now(), diff = now - d.getTime()
  const day = 86400000
  if (diff < day && d.getDate() === new Date().getDate()) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * day) return `${Math.floor(diff / day)} дн. назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: 'идёт',       color: '#00955a', bg: 'rgba(0,196,111,0.1)' },
  done:    { label: 'завершил',   color: '#3a7bd5', bg: 'rgba(58,123,213,0.1)' },
  stopped: { label: 'остановлен', color: '#8a929c', bg: '#eef0f3' },
}

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ page?: string; bot?: string; conv?: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  const sp = await searchParams
  const from = (Math.max(1, Number(sp.page) || 1) - 1) * PER_PAGE
  const botFilter = sp.bot ? Number(sp.bot) : null

  // список ботов (для фильтра и колонки)
  const { data: botsData } = await supabaseAdmin.from('tg_bots').select('id, username, title').order('id')
  const bots = (botsData as { id: number; username: string | null; title: string | null }[]) ?? []
  const botName = new Map(bots.map(b => [b.id, b.username || b.title || `#${b.id}`]))

  const convFilter = sp.conv === 'yes' || sp.conv === 'no' ? sp.conv : null

  // Конверсия «подписчик → заявка»: связь по tg_chat_id (кнопка из воронки) +
  // запасной матч по телефону/юзернейму (если пришёл на сайт не по кнопке).
  const normPhone = (s?: string | null) => (s || '').replace(/\D/g, '').replace(/^998/, '').slice(-9)
  const normUser = (s?: string | null) => (s || '').toLowerCase().replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '').trim()
  const [{ data: appLinks }, { data: allSubs }] = await Promise.all([
    supabaseAdmin.from('applications').select('id, tg_chat_id, contact').order('id', { ascending: false }),
    supabaseAdmin.from('bot_users').select('chat_id, phone, username'),
  ])
  const phoneToChat = new Map<string, number>()
  const userToChat = new Map<string, number>()
  for (const b of (allSubs as { chat_id: number; phone: string | null; username: string | null }[]) ?? []) {
    const p = normPhone(b.phone); if (p.length >= 7) phoneToChat.set(p, b.chat_id)
    const un = normUser(b.username); if (un) userToChat.set(un, b.chat_id)
  }
  const appByChat = new Map<number, number>() // chat_id → id последней заявки этого человека
  for (const a of (appLinks as { id: number; tg_chat_id: number | null; contact: string | null }[]) ?? []) {
    let chat: number | null = a.tg_chat_id ?? null
    if (!chat && a.contact) {
      const p = normPhone(a.contact)
      chat = (p.length >= 7 ? phoneToChat.get(p) : undefined) ?? userToChat.get(normUser(a.contact)) ?? null
    }
    if (chat && !appByChat.has(chat)) appByChat.set(chat, a.id)
  }
  const convChatIds = [...appByChat.keys()]
  const totalSubs = allSubs?.length ?? 0
  const convCount = convChatIds.length

  let q = supabaseAdmin.from('bot_users').select('*', { count: 'exact' }).order('subscribed_at', { ascending: false })
  if (botFilter) q = q.eq('bot_id', botFilter)
  if (convFilter === 'yes') q = convChatIds.length ? q.in('chat_id', convChatIds) : q.eq('chat_id', -1)
  else if (convFilter === 'no' && convChatIds.length) q = q.not('chat_id', 'in', `(${convChatIds.join(',')})`)
  const { data: usersData, error, count } = await q.range(from, from + PER_PAGE - 1)
  const users = (usersData as BotUser[]) ?? []
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages)
  const qs = (p: number) => `?page=${p}${botFilter ? `&bot=${botFilter}` : ''}${convFilter ? `&conv=${convFilter}` : ''}`

  // привязка к авторассылкам (по chat_id)
  const { data: subsData } = await supabaseAdmin.from('broadcast_subscribers').select('chat_id, broadcast_id, status, current_step')
  const { data: bcData } = await supabaseAdmin.from('broadcasts').select('id, name')
  const bcName = new Map((bcData ?? []).map(b => [b.id as number, b.name as string]))
  const subByChat = new Map<number, Sub>()
  for (const s of (subsData as Sub[]) ?? []) subByChat.set(s.chat_id, s)

  return (
    <div style={{ maxWidth: 1080 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Подписчики</h1>
        <span style={{ fontSize: 14, color: '#8a929c' }}>{total}</span>
      </div>
      <p style={{ fontSize: 13, color: '#8a929c', marginBottom: 14 }}>Все, кто заходил в Telegram-боты. <Link href="/admin/funnel/bots" style={{ color: '#00a35c', textDecoration: 'none' }}>Управление ботами →</Link></p>

      {bots.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Link href="/admin/funnel/subscribers" style={chip(!botFilter)}>Все боты</Link>
          {bots.map(b => (
            <Link key={b.id} href={`/admin/funnel/subscribers?bot=${b.id}`} style={chip(botFilter === b.id)}>@{b.username}</Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#5b6470' }}>
          Оставили заявку на сайте: <b style={{ color: '#00a35c' }}>{convCount}</b> из {totalSubs}
          {totalSubs > 0 && <span style={{ color: '#aab2bd' }}> · {Math.round((convCount / totalSubs) * 100)}%</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Link href={`/admin/funnel/subscribers${botFilter ? `?bot=${botFilter}` : ''}`} style={chip(!convFilter)}>Все</Link>
          <Link href={`/admin/funnel/subscribers?conv=yes${botFilter ? `&bot=${botFilter}` : ''}`} style={chip(convFilter === 'yes')}>С заявкой</Link>
          <Link href={`/admin/funnel/subscribers?conv=no${botFilter ? `&bot=${botFilter}` : ''}`} style={chip(convFilter === 'no')}>Без заявки</Link>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '18px 22px', color: '#b87613', fontSize: 13.5, marginBottom: 16 }}>
          Таблица подписчиков ещё не создана. Примени миграцию <code>scripts/migration-broadcast-worker.sql</code> в Supabase → SQL Editor.
        </div>
      )}

      {!error && users.length === 0 && (
        <div className="admin-card" style={{ padding: '56px 20px', textAlign: 'center', color: '#aab2bd', fontSize: 14 }}>Пока никто не заходил в бота</div>
      )}

      {users.length > 0 && (
        <div className="admin-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 112px 80px 0.75fr 76px 76px 104px 92px', gap: 12, padding: '11px 18px', background: '#f7f8fa', fontSize: 11, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #eef0f3' }}>
            <span>Пользователь</span><span>Телефон</span><span>Бот</span><span>Авторассылка</span><span>Подписался</span><span>Активность</span><span>Заявка</span><span></span>
          </div>
          {users.map(u => {
            const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || (u.username ? '' : `id ${u.chat_id}`)
            const sub = subByChat.get(u.chat_id)
            const st = sub ? (STATUS[sub.status ?? 'active'] ?? STATUS.active) : null
            return (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 112px 80px 0.75fr 76px 76px 104px 92px', gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f2f4f7', fontSize: 13.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#e7f7ef', color: '#00a35c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✈️</span>
                  <div style={{ minWidth: 0 }}>
                    {name && <div style={{ fontWeight: 600, color: '#1f2329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>}
                    {u.username
                      ? <a href={`https://t.me/${u.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: '#3a7bd5', textDecoration: 'none' }}>@{u.username}</a>
                      : <span style={{ fontSize: 12.5, color: '#aab2bd' }}>без username</span>}
                  </div>
                </div>
                <span>
                  {u.phone
                    ? <a href={`tel:${u.phone}`} style={{ color: '#00a35c', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>{u.phone}</a>
                    : <span style={{ color: '#c2c8d0' }}>—</span>}
                </span>
                <span style={{ fontSize: 12, color: '#5b6470', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bot_id ? `@${botName.get(u.bot_id)}` : '—'}</span>
                <div style={{ minWidth: 0 }}>
                  {sub
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 13, color: '#3a4250', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bcName.get(sub.broadcast_id) || `#${sub.broadcast_id}`}</span>
                        {st && <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>{st.label}</span>}
                      </span>
                    : <span style={{ color: '#c2c8d0' }}>—</span>}
                </div>
                <span style={{ fontSize: 12.5, color: '#8a929c' }}>{fmt(u.subscribed_at)}</span>
                <span style={{ fontSize: 12.5, color: '#8a929c' }}>{fmt(u.last_seen)}</span>
                <span style={{ fontSize: 12.5 }}>
                  {appByChat.get(u.chat_id)
                    ? <Link href={`/admin/applications/${appByChat.get(u.chat_id)}`} title="Открыть заявку" style={{ color: '#00a35c', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>✓ есть</Link>
                    : <form action={createDealFromSubscriber.bind(null, u.chat_id)} style={{ display: 'inline' }}>
                        <ConfirmSubmit message="Создать заявку из этого подписчика? Появится в разделе «Заявки» как холодный лид из воронки." title="Создать заявку (холодный лид)"
                          style={{ fontSize: 11, padding: '5px 9px', borderRadius: 7, border: '1px solid #bfe0ff', background: '#eff6ff', color: '#2b6cb0', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>+ в заявки</ConfirmSubmit>
                      </form>}
                </span>
                <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {sub && (
                    <form action={resetSubscriber.bind(null, u.chat_id)} style={{ display: 'inline' }}>
                      <button type="submit" title="Обнулить прогресс — цепочка пойдёт заново" style={{ fontSize: 12, padding: '5px 8px', borderRadius: 7, border: '1px solid #e4e7ec', background: '#fff', color: '#8a929c', cursor: 'pointer', fontFamily: 'inherit' }}>⟳</button>
                    </form>
                  )}
                  <form action={deleteSubscriber.bind(null, u.chat_id)} style={{ display: 'inline' }}>
                    <ConfirmSubmit message="Удалить подписчика из списка? Его прогресс воронки тоже очистится. Если человек снова напишет боту — появится заново." title="Удалить подписчика"
                      style={{ fontSize: 12, padding: '5px 8px', borderRadius: 7, border: '1px solid #f0d2ce', background: '#fff', color: '#d24a3d', cursor: 'pointer' }}>✕</ConfirmSubmit>
                  </form>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
          <PagerLink href={qs(page - 1)} disabled={page <= 1} label="←" />
          {pageNums(page, totalPages).map((n, i) => n === '…'
            ? <span key={`e${i}`} style={{ color: '#aab2bd', padding: '0 4px' }}>…</span>
            : <PagerLink key={n} href={qs(n)} active={n === page} label={String(n)} />)}
          <PagerLink href={qs(page + 1)} disabled={page >= totalPages} label="→" />
          <span style={{ fontSize: 12.5, color: '#aab2bd', marginLeft: 8 }}>стр. {page} из {totalPages}</span>
        </div>
      )}
    </div>
  )
}

function PagerLink({ href, label, active, disabled }: { href: string; label: string; active?: boolean; disabled?: boolean }) {
  const style: React.CSSProperties = {
    minWidth: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 9px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
    border: `1px solid ${active ? '#00c46f' : '#e4e7ec'}`,
    background: active ? '#00a35c' : '#fff', color: active ? '#fff' : disabled ? '#c8cdd4' : '#3a4250',
    pointerEvents: disabled ? 'none' : 'auto',
  }
  if (disabled) return <span style={style}>{label}</span>
  return <Link href={`/admin/funnel/subscribers${href}`} style={style}>{label}</Link>
}

function chip(active: boolean): React.CSSProperties {
  return {
    fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
    border: `1px solid ${active ? '#00c46f' : '#e4e7ec'}`,
    background: active ? '#e7f7ef' : '#fff', color: active ? '#00955a' : '#5b6470',
  }
}
