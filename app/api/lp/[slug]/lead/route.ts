import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getBotUsername } from '@/lib/telegram'
import { pickUtm } from '@/lib/attribution'

// Телефон с мини-лендинга → контакт в Базе + токен «лендинг→бот».
// Сразу возвращаем готовую ссылку на Telegram-бота (url), чтобы форма перешла
// туда напрямую, без второго обращения к серверу (/go). Записи в БД — параллельно.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    const phone = (body.phone ?? '').toString().slice(0, 30).trim()
    if (!phone) return NextResponse.json({ ok: false }, { status: 400 })

    const { data: l } = await supabaseAdmin
      .from('landings')
      .select('id, name, title, broadcast_id, button_url, clicks')
      .eq('slug', slug)
      .maybeSingle()

    const source = `Лендинг: ${l?.name || l?.title || slug}`
    const utm = pickUtm(body)
    const token = 'l' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4)

    // финальная ссылка в Telegram (бот воронки — из env; getMe вернул бы клубный бот)
    let url = ''
    if (l?.broadcast_id) {
      const bot = process.env.FUNNEL_BOT_USERNAME || (await getBotUsername())
      if (bot) url = `https://t.me/${bot.replace(/^@/, '')}?start=${token}`
    }
    if (!url && l?.button_url) url = l.button_url as string

    // независимые записи выполняем параллельно (токен, счётчик кликов, контакт с дедупом)
    await Promise.all([
      supabaseAdmin.from('funnel_tokens').insert({
        token, phone, broadcast_id: l?.broadcast_id ?? null,
        utm_source: utm.utm_source, utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, landing_slug: slug,
      }),
      l ? supabaseAdmin.from('landings').update({ clicks: (l.clicks ?? 0) + 1 }).eq('id', l.id) : Promise.resolve(),
      (async () => {
        const { data: existing } = await supabaseAdmin.from('contacts').select('id').eq('phone', phone).limit(1)
        if (!existing || existing.length === 0) {
          await supabaseAdmin.from('contacts').insert({ phone, source, status: 'Новый' })
        }
      })(),
    ])

    return NextResponse.json({ ok: true, token, url })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
