/**
 * Создать аккаунт администратора (роль admin, статус active).
 * Запуск (после migration-users.sql):
 *   node scripts/seed-admin.mjs <email> <пароль> "<Имя>"
 * Пример:
 *   node scripts/seed-admin.mjs tarasiuk@pbc.uz MyPass123 "Виталий Тарасюк"
 */
import { createClient } from '@supabase/supabase-js'
import { scryptSync, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(root, '.env.local'), 'utf-8')
const get = k => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim()
const svc = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_KEY'))

const [email, password, name] = process.argv.slice(2)
if (!email || !password) {
  console.error('Использование: node scripts/seed-admin.mjs <email> <пароль> "<Имя>"')
  process.exit(1)
}

function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`
}

;(async () => {
  const em = email.trim().toLowerCase()
  const { data: exists } = await svc.from('users').select('id').eq('email', em).maybeSingle()
  if (exists) {
    await svc.from('users').update({ role: 'admin', status: 'active', password_hash: hashPassword(password), name: name || 'Админ' }).eq('id', exists.id)
    console.log('✅ Существующий пользователь обновлён до админа:', em)
  } else {
    const { error } = await svc.from('users').insert({ name: name || 'Админ', email: em, password_hash: hashPassword(password), role: 'admin', status: 'active' })
    if (error) { console.error('❌', error.message); process.exit(1) }
    console.log('✅ Админ создан:', em)
  }
  console.log('Войти: /admin/login  (email +', 'пароль)')
})()
