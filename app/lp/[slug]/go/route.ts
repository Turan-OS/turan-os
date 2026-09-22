import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getBotUsername } from '@/lib/telegram'
import { pickUtm, hasUtm } from '@/lib/attribution'

// Клик по кнопке лендинга: считаем клик и ведём в Telegram-бота с выбранной
// авторассылкой (start=bc<id>). Бот по этому параметру подпишет на серию.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const url = new URL(_req.url)
  const token = url.searchParams.get('t') || ''
  const { data: l } = await supabaseAdmin
    .from('landings')
    .select('id, broadcast_id, button_url, clicks, active')
    .eq('slug', slug)
    .maybeSingle()

  if (!l || l.active === false) return NextResponse.redirect(new URL('/', _req.url))
  await supabaseAdmin.from('landings').update({ clicks: (l.clicks ?? 0) + 1 }).eq('id', l.id)

  // приоритет — выбранная авторассылка → ссылка на бота воронки
  // (отдельный бот, обслуживается воркером; можно переопределить через env)
  if (l.broadcast_id) {
    const bot = process.env.FUNNEL_BOT_USERNAME || (await getBotUsername())
    if (bot) {
      let start = token || 'bc' + l.broadcast_id
      // нет токена, но есть метки рекламы → создаём токен с utm, чтобы источник дошёл до подписчика
      const utm = pickUtm(url.searchParams)
      if (!token && hasUtm(utm)) {
        const t = 'g' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4)
        await supabaseAdmin.from('funnel_tokens').insert({
          token: t, broadcast_id: l.broadcast_id, phone: null,
          utm_source: utm.utm_source, utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, landing_slug: slug,
        })
        start = t
      }
      return NextResponse.redirect(`https://t.me/${bot.replace(/^@/, '')}?start=${start}`)
    }
  }
  if (l.button_url) return NextResponse.redirect(l.button_url as string)
  return NextResponse.redirect(new URL('/', _req.url))
}
