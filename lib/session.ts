// Подпись/проверка сессии через Web Crypto (работает в edge-middleware и в Node).
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const enc = new TextEncoder()
const dec = new TextDecoder()

export const SESSION_COOKIE = 'pbc_session'
export type Role = 'admin' | 'administrator' | 'manager'

// Домен cookie: на проде — общий для turanos.uz и www.turanos.uz,
// чтобы сессия не терялась при переходе между ними. Локально/на превью — undefined.
export function cookieDomain(host?: string | null): string | undefined {
  const h = (host || '').split(':')[0]
  if (h === 'turanos.uz' || h.endsWith('.turanos.uz')) return '.turanos.uz'
  return undefined
}
export interface SessionPayload { uid: number; role: Role; name: string; exp: number }

// Все значения cookie с данным именем из сырого заголовка Cookie.
// Браузер может прислать дубли (host-only + domain) — нужно проверить каждую.
export function cookieValues(rawCookieHeader?: string | null, name: string = SESSION_COOKIE): string[] {
  if (!rawCookieHeader) return []
  const out: string[] = []
  for (const part of rawCookieHeader.split(/;\s*/)) {
    if (part.startsWith(name + '=')) {
      const v = part.slice(name.length + 1)
      try { out.push(decodeURIComponent(v)) } catch { out.push(v) }
    }
  }
  return out
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey() {
  return crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createSession(data: { uid: number; role: Role; name: string }, days = 7): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Date.now() + days * 86400000 }
  const p = bytesToB64url(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(p))
  return `${p}.${bytesToB64url(new Uint8Array(sig))}`
}

// Лёгкое чтение сессии БЕЗ проверки подписи (для middleware/Edge).
// Подпись (HMAC) проверяется отдельно в Node-слое (layout) тем же секретом, что и при логине.
export function decodeSession(token?: string | null): SessionPayload | null {
  if (!token) return null
  const p = token.split('.')[0]
  if (!p) return null
  try {
    const payload = JSON.parse(dec.decode(b64urlToBytes(p))) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [p, sig] = token.split('.')
  if (!p || !sig) return null
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), b64urlToBytes(sig), enc.encode(p))
    if (!ok) return null
    const payload = JSON.parse(dec.decode(b64urlToBytes(p))) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// Доступ к разделам по ролям
export const SECTION_ROLES: Record<string, Role[]> = {
  '/admin/applications': ['admin', 'administrator', 'manager'],
  '/admin/contacts':     ['admin', 'administrator', 'manager'],
  '/admin/training/review': ['admin', 'administrator'],
  '/admin/training/docs':   ['admin', 'administrator'],
  '/admin/training/lesson': ['admin', 'administrator'],
  '/admin/training':     ['admin', 'administrator', 'manager'],
  '/admin/news':         ['admin', 'administrator'],
  '/admin/links':        ['admin', 'administrator'],
  '/admin/users':        ['admin'],
  '/admin/settings':     ['admin', 'administrator', 'manager'],
}

export function canAccess(path: string, role: Role): boolean {
  const entry = Object.keys(SECTION_ROLES).find(p => path === p || path.startsWith(p + '/'))
  if (!entry) return true // обзор и прочее — всем авторизованным
  return SECTION_ROLES[entry].includes(role)
}

// Куда отправить роль по умолчанию
export function homeFor(role: Role): string {
  return '/admin'
}
