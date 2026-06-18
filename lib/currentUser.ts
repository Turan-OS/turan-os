import { cookies, headers } from 'next/headers'
import { verifySession, cookieValues, SESSION_COOKIE, type SessionPayload } from '@/lib/session'

// Текущий пользователь из cookie (для серверных компонентов).
// В браузере может быть несколько cookie pbc_session (старая host-only + новая domain) —
// проверяем каждую и принимаем первую с валидной подписью, иначе старая дубль выбрасывает.
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const vals = cookieValues((await headers()).get('cookie'))
  if (!vals.length) {
    const v = (await cookies()).get(SESSION_COOKIE)?.value
    if (v) vals.push(v)
  }
  for (const v of vals) {
    const s = await verifySession(v)
    if (s) return s
  }
  return null
}
