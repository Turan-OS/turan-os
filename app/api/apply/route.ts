import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyTelegram, formatApplicationMessage } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const payload = {
      name:       (body.name ?? '').toString().slice(0, 200) || null,
      contact:    (body.contact ?? '').toString().slice(0, 200) || null,
      is_owner:   (body.isOwner ?? '').toString().slice(0, 20) || null,
      profit:     (body.profit ?? '').toString().slice(0, 20) || null,
      sphere:     (body.sphere ?? '').toString().slice(0, 300) || null,
      instagram:  (body.instagram ?? '').toString().slice(0, 300) || null,
      motivation: (body.motivation ?? '').toString().slice(0, 2000) || null,
      status:     'primary',
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
