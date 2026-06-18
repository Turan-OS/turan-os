/**
 * Импорт базы контактов из CSV в таблицу contacts.
 * Перед запуском: выполни migration-contacts.sql в Supabase.
 * node scripts/import-contacts.mjs
 *
 * Чистит телефоны, помечает дубли (один номер у нескольких записей),
 * заливает ВСЁ (включая Спам/Не подходит — фильтруется в админке).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(root, '.env.local'), 'utf-8')
const get = k => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim()
const svc = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_KEY'))

const FILE = '/Users/tarasuk/Desktop/База стажировка - Стажировка.csv'

function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') q = false
      else field += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') {}
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function normPhone(...cells) {
  const text = cells.join(' ')
  const matches = text.match(/(\+?998[\s\-]?\d[\d\s\-]{7,}|\b9\d{8}\b)/g) || []
  for (const m of matches) {
    const d = m.replace(/\D/g, '')
    if (d.length === 12 && d.startsWith('998')) return '+' + d
    if (d.length === 9) return '+998' + d
    if (d.length >= 12 && d.startsWith('998')) return '+' + d.slice(0, 12)
  }
  return null
}

function tgUser(...cells) {
  const m = cells.join(' ').match(/@([A-Za-z0-9_]{4,})/)
  return m ? '@' + m[1] : null
}

const clean = s => (s || '').toString().trim().replace(/\s+/g, ' ')

// Если в ячейке осмысленный текст (а не только телефон/маркер «Заявка/Лид/Регистрация») — это комментарий
function asComment(s) {
  const t = clean(s)
  if (!t) return ''
  if (/^@[A-Za-z0-9_]+$/.test(t)) return '' // чистый username
  const stripped = t
    .replace(/\+?\d[\d\s\-]{6,}\d/g, ' ')
    .replace(/Заявка|Регистрация на марафон[^,]*|Лид с Битрикса[^,]*|\[[^\]]*\]/gi, ' ')
    .trim()
  return /[а-яёa-z]{6,}/i.test(stripped) ? t : ''
}

// Собрать комментарий из нескольких колонок (без дублей)
function buildComment(...cells) {
  const parts = []
  for (const c of cells) {
    const v = asComment(c)
    if (v && !parts.includes(v)) parts.push(v)
  }
  return parts.join(' · ') || null
}

;(async () => {
  const rows = parseCSV(readFileSync(FILE, 'utf-8'))
  const data = rows.slice(1).filter(r => r.some(c => (c || '').trim()))
  console.log('Строк данных:', data.length)

  const recs = data.map(r => ({
    name:     clean(r[1]) || null,
    phone:    normPhone(r[3], r[4], r[5], r[12], r[13]),
    telegram: tgUser(r[1], r[4], r[13]),
    niche:    clean(r[2]) || null,
    status:   clean(r[6]) || null,
    turnover: clean(r[8]) || null,
    // комментарии собираем из «Комментарий»(9), «Telegram»(4 — туда писали заметки) и «Задача»(10)
    comment:  buildComment(r[9], r[4], r[10]),
    source:   clean(r[7]) || null,
    is_duplicate: false,
  })).filter(rec => rec.name || rec.phone) // отсекаем полностью пустые

  // Пометка дублей по телефону
  const counts = new Map()
  for (const rec of recs) if (rec.phone) counts.set(rec.phone, (counts.get(rec.phone) || 0) + 1)
  let dupCount = 0
  for (const rec of recs) if (rec.phone && counts.get(rec.phone) > 1) { rec.is_duplicate = true; dupCount++ }

  console.log('К заливке:', recs.length, '| помечено дублями:', dupCount, '| с телефоном:', recs.filter(r => r.phone).length)

  // Очистка таблицы (для чистого повторного запуска)
  await svc.from('contacts').delete().neq('id', 0)

  // Заливка пачками по 500
  let inserted = 0
  for (let i = 0; i < recs.length; i += 500) {
    const chunk = recs.slice(i, i + 500)
    const { error } = await svc.from('contacts').insert(chunk)
    if (error) { console.error('❌ Ошибка на пачке', i, ':', error.message); process.exit(1) }
    inserted += chunk.length
    process.stdout.write(`\rЗалито: ${inserted}/${recs.length}`)
  }
  console.log('\n✅ Готово. В базе:', inserted, 'контактов')
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
