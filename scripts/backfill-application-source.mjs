// Бэкфилл: проставить «Источник» и «Оборот» в заявках, которые ранее были
// перенесены из базы контактов (до появления этих полей).
// Запуск ПОСЛЕ миграции: node scripts/backfill-application-source.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// все контакты, уже заведённые в работу (есть application_id)
const { data: linked, error } = await s
  .from('contacts')
  .select('application_id, source, turnover')
  .not('application_id', 'is', null)
if (error) { console.error('Ошибка чтения contacts:', error.message); process.exit(1) }

let updated = 0
for (const c of linked ?? []) {
  const patch = {}
  if (c.source) patch.source = c.source
  if (c.turnover) patch.turnover = c.turnover
  if (!Object.keys(patch).length) continue
  // не затираем уже заполненные значения в заявке
  const { data: app } = await s.from('applications').select('source, turnover').eq('id', c.application_id).single()
  const final = {}
  if (patch.source && !app?.source) final.source = patch.source
  if (patch.turnover && !app?.turnover) final.turnover = patch.turnover
  if (!Object.keys(final).length) continue
  const { error: ue } = await s.from('applications').update(final).eq('id', c.application_id)
  if (ue) { console.error(`#${c.application_id}:`, ue.message); continue }
  updated++
}
console.log(`Готово. Обновлено заявок: ${updated}`)
