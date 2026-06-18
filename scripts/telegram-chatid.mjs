/**
 * Получить chat_id для Telegram-уведомлений.
 *
 * Шаги:
 *  1. Создай бота у @BotFather, вставь токен в .env.local (TELEGRAM_BOT_TOKEN)
 *  2. Напиши своему боту любое сообщение (например «привет»)
 *     — или добавь бота в группу и напиши там
 *  3. Запусти: node scripts/telegram-chatid.mjs
 *  4. Скопируй chat_id в .env.local (TELEGRAM_CHAT_ID)
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(root, '.env.local'), 'utf-8')
const token = env.match(/TELEGRAM_BOT_TOKEN=(.+)/)?.[1]?.trim()

if (!token) {
  console.error('❌ Сначала впиши TELEGRAM_BOT_TOKEN в .env.local')
  process.exit(1)
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
const data = await res.json()

if (!data.ok) {
  console.error('❌ Ошибка:', data.description)
  process.exit(1)
}

if (!data.result.length) {
  console.log('⚠️  Обновлений нет. Напиши боту любое сообщение и запусти снова.')
  process.exit(0)
}

const chats = new Map()
for (const u of data.result) {
  const c = u.message?.chat || u.channel_post?.chat
  if (c) chats.set(c.id, `${c.title || [c.first_name, c.last_name].filter(Boolean).join(' ')} (${c.type})`)
}

console.log('Найденные чаты:\n')
for (const [id, name] of chats) {
  console.log(`  chat_id = ${id}   →  ${name}`)
}
console.log('\nСкопируй нужный chat_id в .env.local → TELEGRAM_CHAT_ID')
