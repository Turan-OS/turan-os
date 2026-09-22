import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyTelegram, formatApplicationMessage } from '@/lib/telegram'
import { classifyChannel, pickUtm, type Utm } from '@/lib/attribution'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ── атрибуция: метки с сайта + переход из воронки (?tgid) ──
    const urlUtm = pickUtm(body)
    const tgChatId = Number(body.tgid) || null
    let attrib: Utm = urlUtm
    let landingSlug = (body.landing_slug ?? '').toString().slice(0, 120) || null
    let fromFunnel = false
    if (tgChatId) {
      fromFunnel = true
      // пришёл из воронки → наследуем исходный источник подписчика
      const { data: bu } = await supabaseAdmin.from('bot_users')
        .select('utm_source, utm_medium, utm_campaign, utm_content, landing_slug')
        .eq('chat_id', tgChatId).maybeSingle()
      if (bu && (bu.utm_source || bu.utm_medium || bu.utm_campaign)) {
        attrib = bu
        landingSlug = bu.landing_slug ?? landingSlug
      }
    }
    const channel = classifyChannel(attrib, fromFunnel)
    const srcLabel = 'Сайт · ' + channel + (attrib.utm_campaign ? ` · ${attrib.utm_campaign}` : '')

    const payload = {
      name:       (body.name ?? '').toString().slice(0, 200) || null,
      contact:    (body.contact ?? '').toString().slice(0, 200) || null,
      is_owner:   (body.isOwner ?? '').toString().slice(0, 20) || null,
      profit:     (body.profit ?? '').toString().slice(0, 20) || null,
      sphere:     (body.sphere ?? '').toString().slice(0, 300) || null,
      instagram:  (body.instagram ?? '').toString().slice(0, 300) || null,
      motivation: (body.motivation ?? '').toString().slice(0, 2000) || null,
      source:     srcLabel,
      status:     'primary',
      channel,
      utm_source:   attrib.utm_source ?? null,
      utm_medium:   attrib.utm_medium ?? null,
      utm_campaign: attrib.utm_campaign ?? null,
      utm_content:  attrib.utm_content ?? null,
      landing_slug: landingSlug,
      landing_url:  (body.landing_url ?? '').toString().slice(0, 500) || null,
      tg_chat_id:   tgChatId,
    }

    const { data, error } = await supabaseAdmin.from('applications').insert(payload).select('id').single()

    if (error) {
      console.error('apply insert error:', error.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    // Уведомление в Telegram (не блокирует ответ при сбое)
    await notifyTelegram(formatApplicationMessage({ id: data?.id, ...payload }))

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('apply route error:', e)
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
