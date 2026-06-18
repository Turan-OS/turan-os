import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, hashPassword } from '@/lib/password'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const store = await cookies()
    const session = await verifySession(store.get(SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { current, next } = await req.json()
    if (!next || `${next}`.length < 6) return NextResponse.json({ error: 'Новый пароль — от 6 символов' }, { status: 400 })

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session.uid).single()
    if (!user || !verifyPassword(`${current}`, user.password_hash)) {
      return NextResponse.json({ error: 'Текущий пароль неверный' }, { status: 400 })
    }
    await supabaseAdmin.from('users').update({ password_hash: hashPassword(`${next}`) }).eq('id', session.uid)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
