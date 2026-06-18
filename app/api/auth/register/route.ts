import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { notifyTelegram } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    const em = (email ?? '').toString().trim().toLowerCase()
    const nm = (name ?? '').toString().trim()
    const pw = (password ?? '').toString()

    if (!nm || !em || pw.length < 6) {
      return NextResponse.json({ error: 'Заполните имя, email и пароль (от 6 символов)' }, { status: 400 })
    }

    const { data: exists } = await supabaseAdmin.from('users').select('id').eq('email', em).maybeSingle()
    if (exists) return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 409 })

    const { error } = await supabaseAdmin.from('users').insert({
      name: nm, email: em, password_hash: hashPassword(pw),
      role: 'manager', status: 'pending',
    })
    if (error) return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })

    await notifyTelegram(`👥 <b>Новая регистрация в админке</b>\n\n${nm} — ${em}\n\nЖдёт одобрения. Подтверди в разделе «Пользователи».`)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
