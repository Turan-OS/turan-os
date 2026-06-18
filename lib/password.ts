import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

// Хэш пароля: "salt:hash" (scrypt). Только Node-рантайм (API-роуты).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || '').split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const known = Buffer.from(hash, 'hex')
  return test.length === known.length && timingSafeEqual(test, known)
}
