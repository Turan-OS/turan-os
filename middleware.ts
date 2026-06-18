import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeSession, canAccess, homeFor, cookieValues } from '@/lib/session'

const PUBLIC = ['/admin/login', '/admin/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // прокидываем путь в server-компоненты (layout это читает)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } })

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (PUBLIC.includes(pathname)) return pass()

  // лёгкая проверка: есть ли непросроченная сессия (без HMAC).
  // Полную проверку подписи делает layout в Node-рантайме.
  // Может быть несколько cookie pbc_session — декодируем любую валидную.
  let session = null
  for (const v of cookieValues(req.headers.get('cookie'))) {
    const s = decodeSession(v)
    if (s) { session = s; break }
  }
  if (!session) return NextResponse.redirect(new URL('/admin/login', req.url))
  if (!canAccess(pathname, session.role)) return NextResponse.redirect(new URL(homeFor(session.role), req.url))
  return pass()
}

export const config = {
  matcher: ['/admin/:path*'],
}
