// Загружает тестовое видео в storage и создаёт полностью заполненный пример-пост.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

const VIDEO = '/Users/tarasuk/Documents/Business/Consulting/TURAN OS/Video/reels/07.09.2026.mp4'
const path = `content/example-${Date.now()}.mp4`
const buf = readFileSync(VIDEO)

const up = await supa.storage.from('photos').upload(path, buf, { contentType: 'video/mp4', upsert: true })
if (up.error) { console.error('upload error:', up.error.message); process.exit(1) }
const { data: pub } = supa.storage.from('photos').getPublicUrl(path)
const url = pub.publicUrl
console.log('video url:', url)

const caption = `Снял деньги со счёта ООО на свою карту и думаешь, что всё в порядке? 🚨

Деньги компании это НЕ твои личные деньги. Даже если ты единственный учредитель.

Что важно знать:
• ООО это отдельное юрлицо, у него свой «кошелёк»
• Просто так вывести нельзя, это не ИП
• Законный способ забрать прибыль это дивиденды
• Дивиденды платятся с чистой прибыли, после налога
• Снял «в обход» = риск доначислений и вопросов налоговой

Хочешь выводить прибыль спокойно и без рисков? Запишись на бесплатную консультацию, разберём твою ситуацию 👇

#бизнесузбекистан #бухгалтерия #налоги #ООО #дивиденды #TURANOS`

const post = {
  title: 'Почему нельзя просто снять деньги со счёта ООО',
  description: 'Разбираем на пальцах: деньги компании это не деньги собственника. Как законно выводить прибыль через дивиденды.\n\n🏷 Мифы · ⭐ Высокий · 📄 Дивиденды учредителю\n💡 Пример полностью заполненного поста с видео',
  caption,
  type: 'reel',
  status: 'approved',
  publish_date: '2026-11-12',
  media: [url],
  platform: 'instagram',
  sort: 0,
  created_by_name: 'Пример',
  approved_by_name: 'Виталий',
  approved_at: new Date().toISOString(),
}

await supa.from('content_posts').delete().eq('created_by_name', 'Пример')
const ins = await supa.from('content_posts').insert(post).select('id').single()
if (ins.error) { console.error('insert error:', ins.error.message); process.exit(1) }
console.log('пример создан, id:', ins.data.id)
