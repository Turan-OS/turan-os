// Загружает карусель «5 цифр собственника» и заполняет пост №10 целиком (пример).
import { readFileSync, readdirSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

const DIR = '/Users/tarasuk/Documents/Media/Instagram/Carousels/5 цифр собственника'
const files = readdirSync(DIR).filter(f => /\.png$/i.test(f)).sort()

const media = []
for (const f of files) {
  const buf = readFileSync(`${DIR}/${f}`)
  const path = `content/5cifr-${Date.now()}-${f}`
  const up = await supa.storage.from('photos').upload(path, buf, { contentType: 'image/png', upsert: true })
  if (up.error) { console.error('upload error', f, up.error.message); process.exit(1) }
  media.push(supa.storage.from('photos').getPublicUrl(path).data.publicUrl)
}
console.log('слайдов загружено:', media.length)

const caption = `Управляете бизнесом по ощущениям или по цифрам? 📊

Собственнику не нужен весь отчёт бухгалтера. Достаточно 5 цифр, которые показывают здоровье бизнеса. 10 минут в пятницу, и вы держите руку на пульсе:

1️⃣ Выручка, сколько заработали за неделю
2️⃣ Деньги на счетах, сколько реально есть сейчас
3️⃣ Дебиторка, сколько вам должны
4️⃣ Прибыль, что осталось после всех расходов
5️⃣ Воронка продаж, сколько денег на подходе

Смотрите их регулярно, и перестанете принимать решения вслепую.

Хотите видеть эти 5 цифр автоматически, без таблиц вручную? Напишите в комментариях ЦИФРЫ, и мы бесплатно разберём ваш бизнес 👇

Telegram @turanosbuh · +998 97 431 40 00

#финансыбизнеса #бухгалтерия #управленческийучёт #бизнесузбекистан #TURANOS`

const patch = {
  caption,
  media,
  status: 'approved',
  publish_date: '2026-11-14',
  approved_by_name: 'Виталий',
  approved_at: new Date().toISOString(),
  created_by_name: 'Карусель (пример)',   // защищаем от перезаписи re-import
  updated_at: new Date().toISOString(),
}

// находим пост «5 цифр…» среди импортированных
const { data: found } = await supa.from('content_posts')
  .select('id').ilike('title', '5 цифр%').order('id').limit(1).maybeSingle()

let id
if (found) {
  await supa.from('content_posts').update(patch).eq('id', found.id)
  id = found.id
} else {
  const ins = await supa.from('content_posts').insert({
    title: '5 цифр, которые собственник смотрит каждую неделю',
    description: 'Выручка, деньги, дебиторка, прибыль, воронка; 10 минут в пятницу.\n\n🏷 Деньги · ⭐ Высокий · 📄 5 цифр собственника',
    type: 'carousel', sort: 10, platform: 'instagram', ...patch,
  }).select('id').single()
  id = ins.data?.id
}
console.log('пост заполнен, id:', id)
