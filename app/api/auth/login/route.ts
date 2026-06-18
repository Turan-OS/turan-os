import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'
import { createSession, SESSION_COOKIE, cookieDomain, type Role } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const em = (email ?? '').toString().trim().toLowerCase()
    const pw = (password ?? '').toString()

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('email', em).maybeSingle()
    if (!user || !verifyPassword(pw, user.password_hash)) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }
    if (user.status === 'pending') {
      return NextResponse.json({ error: 'Аккаунт ещё не подтверждён администратором' }, { status: 403 })
    }
    if (user.status === 'blocked') {
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 })
    }

    const token = await createSession({ uid: user.id, role: user.role as Role, name: user.name })
    const res = NextResponse.json({ ok: true, role: user.role })
    // secure по фактическому протоколу: по https — secure, по http (напр. при отладке) — обычная,
    // чтобы cookie не терялась молча. За прокси читаем x-forwarded-proto.
    const proto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim()
    const isHttps = proto ? proto === 'https' : process.env.NODE_ENV === 'production'
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, sameSite: 'lax',
      secure: isHttps,
      maxAge: 7 * 24 * 60 * 60, path: '/',
      domain: cookieDomain(req.headers.get('host')),
    })
    return res
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
