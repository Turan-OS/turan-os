/**
 * Заполнить черновик новости содержимым статьи.
 * Запуск:  node scripts/fill-news.mjs <id> <путь-к-.md> <путь-к-meta.json>
 *   meta.json: { "title": "...", "description": "...", "tags": ["..."] }
 * Тело (.md) идёт в content, meta — в title/description/tags.
 * Статус (published/approved) НЕ трогаем — остаётся черновиком «на проверке».
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(root, '.env.local'), 'utf-8')
const get = k => env.match(new RegExp('^' + k + '=(.+)', 'm'))?.[1]?.trim()
const svc = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })

const [id, mdPath, metaPath] = process.argv.slice(2)
if (!id || !mdPath) { console.error('Использование: node scripts/fill-news.mjs <id> <md> <meta.json>'); process.exit(1) }

const content = readFileSync(mdPath, 'utf-8').trim()
const meta = metaPath ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {}
const fields = { content }
if (meta.title) fields.title = meta.title
if (meta.description) fields.description = meta.description
if (meta.tags) fields.tags = meta.tags

const { data, error } = await svc.from('news').update(fields).eq('id', Number(id)).select('id, title, published, approved').maybeSingle()
if (error) { console.error('ERR', error); process.exit(1) }
console.log('OK', data, '| content:', content.length, 'chars')
