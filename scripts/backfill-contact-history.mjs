// Бэкфилл: проставить contact_id в существующей истории (комментарии/задачи/активность)
// по связке контакт → его сделка (contacts.application_id).
// Запуск ПОСЛЕ миграции: node scripts/backfill-contact-history.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const { data: linked, error } = await s
  .from('contacts').select('id, application_id').not('application_id', 'is', null)
if (error) { console.error('Ошибка чтения contacts:', error.message); process.exit(1) }

const tables = ['application_comments', 'application_tasks', 'application_activity']
let total = 0
for (const c of linked ?? []) {
  for (const t of tables) {
    const { data, error: ue } = await s.from(t)
      .update({ contact_id: c.id })
      .eq('application_id', c.application_id)
      .is('contact_id', null)
      .select('id')
    if (ue) { console.error(`${t} (contact ${c.id}):`, ue.message); continue }
    total += data?.length ?? 0
  }
}
console.log(`Готово. Размечено строк истории: ${total}`)
