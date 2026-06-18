/**
 * Анализ исходной базы (CSV) — структура, телефоны, источники, дубли.
 * node scripts/analyze-base.mjs
 */
import { readFileSync } from 'fs'

const FILE = '/Users/tarasuk/Desktop/База стажировка - Стажировка.csv'
const raw = readFileSync(FILE, 'utf-8')

// ── Робастный парсер CSV (кавычки, переносы, запятые внутри полей) ──
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
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const rows = parseCSV(raw)
const header = rows[0]
const data = rows.slice(1).filter(r => r.some(c => (c || '').trim()))

console.log('Колонок в заголовке:', header.length)
console.log('Строк данных:', data.length)

// ── Нормализация телефона ──
function normPhones(...cells) {
  const text = cells.join(' ')
  const found = new Set()
  // ищем последовательности цифр (с возможными + - пробел)
  const matches = text.match(/(\+?998[\s\-]?\d[\d\s\-]{7,}|\b9\d{8}\b)/g) || []
  for (let m of matches) {
    const digits = m.replace(/\D/g, '')
    let n = null
    if (digits.length === 12 && digits.startsWith('998')) n = '+' + digits
    else if (digits.length === 9) n = '+998' + digits
    else if (digits.length === 13 && digits.startsWith('998')) n = '+' + digits.slice(0, 12)
    if (n) found.add(n)
  }
  return [...found]
}

// колонки (по индексам из заголовка)
const COL = { name: 1, niche: 2, num1: 3, tg: 4, num2: 5, status: 6, source: 7, turnover: 8, comment: 9 }

let withPhone = 0
const phoneMap = new Map() // phone -> [rowIndex...]
const bySource = new Map()
const cleaned = []

data.forEach((r, i) => {
  const phones = normPhones(r[COL.num1], r[COL.tg], r[COL.num2], r[COL.name])
  if (phones.length) withPhone++
  const primary = phones[0] || null
  if (primary) phoneMap.set(primary, [...(phoneMap.get(primary) || []), i])

  const source = (r[COL.source] || '').trim() || '—'
  bySource.set(source, (bySource.get(source) || 0) + 1)

  cleaned.push({
    name: (r[COL.name] || '').trim(),
    phone: primary,
    allPhones: phones,
    status: (r[COL.status] || '').trim(),
    source,
    niche: (r[COL.niche] || '').trim(),
    comment: (r[COL.comment] || '').trim(),
  })
})

console.log('\n── Телефоны ──')
console.log('Строк с телефоном:', withPhone, '/', data.length)
console.log('Уникальных телефонов:', phoneMap.size)
const dups = [...phoneMap.entries()].filter(([, idx]) => idx.length > 1)
console.log('Дубли по телефону:', dups.length, '(номеров, встречающихся 2+ раз)')

console.log('\n── По источникам (топ 15) ──')
;[...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([s, n]) => console.log('  ' + n + '\t' + s.slice(0, 50)))

console.log('\n── Статусы (топ 12) ──')
const byStatus = new Map()
cleaned.forEach(c => byStatus.set(c.status || '—', (byStatus.get(c.status || '—') || 0) + 1))
;[...byStatus.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([s, n]) => console.log('  ' + n + '\t' + (s || '—')))

console.log('\n── Примеры дублей (первые 3) ──')
dups.slice(0, 3).forEach(([phone, idx]) => {
  console.log('  ' + phone + ' →', idx.map(i => cleaned[i].name || '?').join(' | '))
})

console.log('\n── Без имени или без телефона ──')
console.log('Без телефона:', cleaned.filter(c => !c.phone).length)
console.log('Без имени:', cleaned.filter(c => !c.name).length)
console.log('Без имени И без телефона (мусор):', cleaned.filter(c => !c.name && !c.phone).length)
