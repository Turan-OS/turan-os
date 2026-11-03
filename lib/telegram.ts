import { supabaseAdmin } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'

export type NotifyChat = { id: number; title: string; type?: string }

/** Низкоуровневая отправка одному чату */
async function sendOne(token: string, chatId: number | string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!res.ok) console.error('Telegram notify failed:', chatId, res.status, await res.text())
    return res.ok
  } catch (e) {
    console.error('Telegram notify error:', chatId, e)
    return false
  }
}

/** Список чатов для уведомлений из БД (settings.telegram_notify_chats) */
export async function getNotifyChats(): Promise<NotifyChat[]> {
  try {
    const raw = await getSetting('telegram_notify_chats', '')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((c: NotifyChat) => c && c.id) : []
  } catch { return [] }
}

/**
 * Отправка уведомления о заявке во ВСЕ подключённые чаты:
 *   env TELEGRAM_CHAT_ID (можно несколько через запятую) + чаты/группы из админки.
 * Требует env TELEGRAM_BOT_TOKEN. Если ни токена, ни чатов нет — тихо пропускает.
 */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  const ids = new Set<string>()
  for (const c of (process.env.TELEGRAM_CHAT_ID || '').split(',')) {
    const v = c.trim(); if (v) ids.add(v)
  }
  for (const c of await getNotifyChats()) ids.add(String(c.id))
  if (ids.size === 0) return

  await Promise.all([...ids].map(id => sendOne(token, id, text)))
}

/**
 * Обнаружить чаты, которые «видел» бот (личные диалоги и группы),
 * чтобы подключить их одним кликом. Читает getUpdates не поглощая очередь (без offset).
 */
export async function detectTelegramChats(): Promise<NotifyChat[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return []
  try {
    const au = encodeURIComponent(JSON.stringify(['message', 'my_chat_member', 'channel_post']))
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0&allowed_updates=${au}`, { cache: 'no-store' })
    const j = await res.json()
    const updates: Array<Record<string, { chat?: { id: number; title?: string; first_name?: string; last_name?: string; username?: string; type: string } }>> = j?.result ?? []
    const map = new Map<number, NotifyChat>()
    for (const u of updates) {
      const chat = u?.message?.chat || u?.my_chat_member?.chat || u?.channel_post?.chat || u?.edited_message?.chat
      if (chat?.id) {
        const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || String(chat.id)
        map.set(chat.id, { id: chat.id, title, type: chat.type })
      }
    }
    return [...map.values()]
  } catch (e) {
    console.error('detectTelegramChats error:', e)
    return []
  }
}

/** Отправка сообщения конкретному пользователю (по его chat_id) */
export async function sendTelegramTo(chatId: number | string | null | undefined, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    return res.ok
  } catch (e) {
    console.error('Telegram sendTo error:', e)
    return false
  }
}

/** Юзернейм бота (для deep-link t.me/<bot>?start=<code>) */
export async function getBotUsername(): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (token) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: 'no-store' })
      const j = await res.json()
      if (j?.result?.username) return j.result.username
    } catch { /* фолбэк ниже */ }
  }
  // фолбэк: активный воронк-бот из tg_bots (токены ботов живут в БД, мультибот)
  try {
    const { data } = await supabaseAdmin.from('tg_bots').select('username').eq('active', true).order('id').limit(1).maybeSingle()
    return data?.username ?? null
  } catch { return null }
}

/** Найти chat_id по коду подключения среди последних апдейтов бота (/start <code>) */
export async function findChatIdByCode(code: string): Promise<{ id: number; name: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !code) return null
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0`, { cache: 'no-store' })
    const j = await res.json()
    const updates: Array<{ message?: { text?: string; chat?: { id: number; first_name?: string; username?: string } } }> = j?.result ?? []
    for (let i = updates.length - 1; i >= 0; i--) {
      const m = updates[i]?.message
      const t = (m?.text || '').trim()
      if (m?.chat?.id && (t === `/start ${code}` || t === code)) {
        return { id: m.chat.id, name: m.chat.first_name || m.chat.username || '' }
      }
    }
    return null
  } catch (e) {
    console.error('Telegram findChatIdByCode error:', e)
    return null
  }
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Форматирование сообщения о новой заявке */
export function formatApplicationMessage(a: {
  id?: number; name?: string | null; contact?: string | null
  is_owner?: string | null; profit?: string | null
  sphere?: string | null; instagram?: string | null; motivation?: string | null
}): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'
  const lines = [
    '🔔 <b>Новая заявка в TURAN OS</b>',
    '',
    a.name ? `👤 <b>${esc(a.name)}</b>` : '👤 <i>Без имени</i>',
    a.contact ? `📞 ${esc(a.contact)}` : '',
    '',
    `🏢 Собственник: <b>${esc(a.is_owner || '—')}</b>   💰 Доход 5K+: <b>${esc(a.profit || '—')}</b>`,
    a.sphere ? `🔎 Сфера: ${esc(a.sphere)}` : '',
    a.instagram ? `📸 ${esc(a.instagram)}` : '',
    a.motivation ? `💬 ${esc(a.motivation)}` : '',
    '',
    a.id ? `➡️ <a href="${site}/admin/applications/${a.id}">Открыть в CRM</a>` : '',
  ]
  return lines.filter(l => l !== '').join('\n')
}
