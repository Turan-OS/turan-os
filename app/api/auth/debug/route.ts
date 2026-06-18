import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { SESSION_COOKIE, cookieDomain, cookieValues, decodeSession, verifySession } from '@/lib/session'

// Диагностика авторизации на продакшене.
// Открыть: https://<домен>/api/auth/debug  (после попытки входа)
// Не раскрывает значения секретов — только факт их наличия и статус cookie.
export async function GET() {
  const h = await headers()
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value || null

  // все cookie pbc_session (могут быть дубли host-only + domain)
  const allVals = cookieValues(h.get('cookie'))
  let anyValid = false
  for (const v of allVals) { if (await verifySession(v)) { anyValid = true; break } }

  const decoded = decodeSession(raw)               // без проверки подписи
  const verified = await verifySession(raw)        // с проверкой подписи (HMAC)

  const host = h.get('host')
  const secret = process.env.SESSION_SECRET || ''

  return NextResponse.json({
    ok: true,
    request: {
      host,
      forwardedProto: h.get('x-forwarded-proto') || null,  // если 'http' — secure-cookie не сохранится
      forwardedHost: h.get('x-forwarded-host') || null,
    },
    cookie: {
      present: !!raw,
      count: allVals.length,                    // сколько cookie pbc_session (≥2 = дубли!)
      anyValid,                                 // хоть одна с валидной подписью
      length: raw?.length ?? 0,
      decodes: !!decoded,                       // структура/срок ок
      signatureValid: !!verified,               // подпись у той, что вернул store.get
      expired: decoded ? decoded.exp < Date.now() : null,
      role: decoded?.role ?? null,
      name: decoded?.name ?? null,
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      sessionSecretSet: !!secret,
      sessionSecretIsDefault: secret === '' || secret === 'dev-secret-change-me',
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeySet: !!process.env.SUPABASE_SERVICE_KEY,
      cookieDomainWouldBe: cookieDomain(host) ?? '(host-only)',
      cookieSecureFlag: process.env.NODE_ENV === 'production',
    },
    hint: !raw
      ? 'Cookie не дошла. Либо вход не выполнялся, либо secure-cookie не сохранилась (заходишь по http?), либо домен cookie не совпал с хостом.'
      : !verified
      ? 'Cookie есть, но подпись не сходится → SESSION_SECRET отличается от того, чем подписывали (не задан/менялся). Задай SESSION_SECRET в окружении и перелогинься.'
      : 'Сессия валидна — авторизация в порядке.',
  })
}
