import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import ReplyBox from './ReplyBox'

type Msg = {
  id: number; chat_id: number; bot_id: number | null; direction: string
  text: string | null; media: string | null; author_name: string | null; created_at: string
}
type BotUser = { chat_id: number; username: string | null; first_name: string | null; last_name: string | null; phone: string | null; bot_id: number | null }

const fmtTime = (s: string) => new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
const fmtWhen = (s: string) => {
  const d = new Date(s), now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 7) return d.toLocaleDateString('ru-RU', { weekday: 'short' })
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
const nameOf = (u?: BotUser, chatId?: number) =>
  (u && [u.first_name, u.last_name].filter(Boolean).join(' ')) || (u?.username ? '@' + u.username : `id ${chatId ?? u?.chat_id}`)

export default async function DialogsPage({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin')

  const sp = await searchParams
  const activeChat = sp.chat ? Number(sp.chat) : null

  // последние сообщения — для списка диалогов (последние 1000 событий)
  const { data: recentData, error } = await supabaseAdmin.from('bot_messages')
    .select('id, chat_id, bot_id, direction, text, media, author_name, created_at')
    .order('created_at', { ascending: false }).limit(1000)
  const recent = (recentData as Msg[]) ?? []

  // группировка по чату → последнее сообщение (recent идёт по убыванию, первое = самое свежее)
  const lastByChat = new Map<number, Msg>()
  const countByChat = new Map<number, number>()
  for (const m of recent) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m)
    countByChat.set(m.chat_id, (countByChat.get(m.chat_id) ?? 0) + 1)
  }
  const chatIds = [...lastByChat.keys()]

  // данные пользователей + названия/токены ботов
  const { data: usersData } = chatIds.length
    ? await supabaseAdmin.from('bot_users').select('chat_id, username, first_name, last_name, phone, bot_id').in('chat_id', chatIds)
    : { data: [] as BotUser[] }
  const uMap = new Map((usersData as BotUser[] ?? []).map(u => [u.chat_id, u]))
  const { data: botsData } = await supabaseAdmin.from('tg_bots').select('id, username, title, token')
  const botName = new Map((botsData ?? []).map(b => [b.id as number, (b.username || b.title || `#${b.id}`) as string]))
  const botHasToken = new Map((botsData ?? []).map(b => [b.id as number, !!b.token]))

  // сообщения активного диалога
  let activeMsgs: Msg[] = []
  let activeUser: BotUser | undefined
  let activeBotId: number | null = null
  if (activeChat) {
    const { data } = await supabaseAdmin.from('bot_messages').select('*').eq('chat_id', activeChat).order('created_at', { ascending: true }).limit(500)
    activeMsgs = (data as Msg[]) ?? []
    activeUser = uMap.get(activeChat)
    activeBotId = activeUser?.bot_id ?? activeMsgs.find(m => m.bot_id)?.bot_id ?? null
  }
  const canReply = activeChat != null && activeBotId != null && botHasToken.get(activeBotId) === true

  // ── ответ пользователю: шлём напрямую через токен бота этого чата, пишем в диалог ──
  async function reply(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    if (!u || u.role === 'manager') return
    const chatId = Number(formData.get('chat_id'))
    const text = ((formData.get('text') as string) ?? '').trim()
    if (!chatId || !text) return
    const { data: bu } = await supabaseAdmin.from('bot_users').select('bot_id').eq('chat_id', chatId).maybeSingle()
    const botId = bu?.bot_id ?? null
    const { data: bot } = botId != null
      ? await supabaseAdmin.from('tg_bots').select('token').eq('id', botId).maybeSingle()
      : { data: null }
    if (!bot?.token) return
    let tgMsgId: number | null = null
    try {
      const res = await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      const j = await res.json()
      if (!j.ok) return
      tgMsgId = j.result?.message_id ?? null
    } catch { return }
    await supabaseAdmin.from('bot_messages').insert({
      bot_id: botId, chat_id: chatId, direction: 'out', text, tg_message_id: tgMsgId, author_name: u.name,
    })
    // отметить, что менеджер общается — обновим last_seen контакта, но это не критично
    revalidatePath('/admin/funnel/dialogs')
  }

  // сортировка диалогов по времени последнего сообщения
  const conversations = chatIds
    .map(id => ({ id, last: lastByChat.get(id)!, user: uMap.get(id), count: countByChat.get(id) ?? 0 }))
    .sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime())

  const preview = (m: Msg) => (m.direction === 'out' ? '↩ ' : '') + (m.text || m.media || '')

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Диалоги</h1>
        <span style={{ fontSize: 14, color: '#8a929c' }}>{conversations.length}</span>
      </div>
      <p style={{ fontSize: 13, color: '#8a929c', marginBottom: 18 }}>Всё, что пишут людям в Telegram-боты. Можно ответить — сообщение уйдёт от имени бота.</p>

      {error && (
        <div className="admin-card" style={{ padding: '18px 22px', color: '#b87613', fontSize: 13.5, marginBottom: 16 }}>
          Таблица диалогов ещё не создана. Примени миграцию <code>scripts/migration-dialogs.sql</code>.
        </div>
      )}

      {!error && conversations.length === 0 && (
        <div className="admin-card" style={{ padding: '56px 20px', textAlign: 'center', color: '#aab2bd', fontSize: 14 }}>
          Пока никто не писал в боты. Как только напишут — появится здесь.
        </div>
      )}

      {conversations.length > 0 && (
        <div className="admin-card" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 560, overflow: 'hidden', padding: 0 }}>
          {/* Список диалогов */}
          <div style={{ borderRight: '1px solid #eef0f3', overflowY: 'auto', maxHeight: 620 }}>
            {conversations.map(c => {
              const active = c.id === activeChat
              return (
                <Link key={c.id} href={`/admin/funnel/dialogs?chat=${c.id}`} style={{
                  display: 'block', padding: '12px 16px', borderBottom: '1px solid #f2f4f7', textDecoration: 'none',
                  background: active ? '#eaf7f0' : '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1f2329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(c.user, c.id)}</span>
                    <span style={{ fontSize: 11, color: '#aab2bd', marginLeft: 'auto', flexShrink: 0 }}>{fmtWhen(c.last.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 12.5, color: '#8a929c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{preview(c.last)}</span>
                    {c.user?.bot_id && <span style={{ fontSize: 10.5, color: '#aab2bd', flexShrink: 0 }}>@{botName.get(c.user.bot_id)}</span>}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Активный диалог */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 620 }}>
            {!activeChat && (
              <div style={{ margin: 'auto', color: '#aab2bd', fontSize: 14, padding: 40 }}>Выберите диалог слева</div>
            )}
            {activeChat && (
              <>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid #eef0f3', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#e7f7ef', color: '#00a35c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✈️</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2329' }}>{nameOf(activeUser, activeChat)}</div>
                    <div style={{ fontSize: 12, color: '#8a929c' }}>
                      {activeUser?.username && <a href={`https://t.me/${activeUser.username}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3a7bd5', textDecoration: 'none' }}>@{activeUser.username}</a>}
                      {activeUser?.phone && <span> · {activeUser.phone}</span>}
                      {activeBotId && <span> · бот @{botName.get(activeBotId)}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, background: '#f7f8fa' }}>
                  {activeMsgs.map(m => {
                    const out = m.direction === 'out'
                    return (
                      <div key={m.id} style={{ alignSelf: out ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                        <div style={{
                          padding: '8px 12px', borderRadius: out ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                          background: out ? '#00a35c' : '#fff', color: out ? '#fff' : '#1f2329',
                          border: out ? 'none' : '1px solid #e4e7ec', fontSize: 13.5, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.text || <span style={{ fontStyle: 'italic', opacity: 0.75 }}>{m.media}</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#aab2bd', marginTop: 2, textAlign: out ? 'right' : 'left' }}>
                          {out && m.author_name ? `${m.author_name} · ` : ''}{fmtTime(m.created_at)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {canReply
                  ? <ReplyBox chatId={activeChat} action={reply} />
                  : <div style={{ padding: '14px 18px', borderTop: '1px solid #eef0f3', fontSize: 12.5, color: '#b87613' }}>
                      Ответить нельзя: у бота этого диалога не задан токен (раздел «Боты»).
                    </div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
