/**
 * Отправка уведомлений в Telegram-бот.
 * Требует env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Если переменные не заданы — тихо пропускает (не ломает запрос).
 */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      console.error('Telegram notify failed:', res.status, await res.text())
    }
  } catch (e) {
    console.error('Telegram notify error:', e)
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
  if (!token) return null
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: 'no-store' })
    const j = await res.json()
    return j?.result?.username ?? null
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
