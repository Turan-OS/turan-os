import { NextResponse } from 'next/server'
import { SESSION_COOKIE, cookieDomain } from '@/lib/session'

// Реальный выход — ТОЛЬКО POST.
// Раньше logout был GET-ссылкой: Next/браузер предзагружал её (prefetch),
// антивирусы и сканеры ссылок дёргали GET — и сессия молча сбрасывалась
// (отсюда «выкидывает каждую минуту»). Теперь GET ничего не очищает.
function clearAndRedirect(req: Request) {
  const res = NextResponse.redirect(new URL('/admin/login', req.url), 303)
  // чистим обе вариации cookie: с доменом и host-only — чтобы не осталось дубля
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0, domain: cookieDomain(req.headers.get('host')) })
  res.headers.append('set-cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  return res
}

export async function POST(req: Request) {
  return clearAndRedirect(req)
}

// GET НЕ очищает сессию — просто отправляет на логин (безопасно для prefetch/сканеров).
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/admin/login', req.url))
}
