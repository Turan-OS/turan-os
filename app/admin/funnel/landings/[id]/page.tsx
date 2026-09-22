import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import { slugify } from '@/lib/slug'
import ImageField from '@/app/admin/news/ImageField'

type Landing = {
  id: number; name: string | null; slug: string | null; title: string | null
  image_url: string | null; description: string | null
  button_text: string | null; button_url: string | null; active: boolean | null
  collect_phone: boolean | null; broadcast_id: number | null; pixel_id: string | null
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '16px 0 7px' }

export default async function LandingEditor({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  const { id } = await params
  const isNew = id === 'new'

  let l: Landing | null = null
  if (!isNew) {
    const { data } = await supabaseAdmin.from('landings').select('*').eq('id', Number(id)).maybeSingle()
    if (!data) notFound()
    l = data as Landing
  }

  // авторассылки для выбора
  const { data: bcData } = await supabaseAdmin.from('broadcasts').select('id, name').order('created_at', { ascending: false })
  const broadcasts = (bcData as { id: number; name: string | null }[]) ?? []

  async function save(formData: FormData) {
    'use server'
    const g = (k: string) => ((formData.get(k) as string) ?? '').trim() || null
    const name = g('name'); const title = g('title')
    // slug из названия/заголовка, уникальный
    let slug = l?.slug || slugify(name || title || 'lp')
    if (!l?.slug) {
      const { data: clash } = await supabaseAdmin.from('landings').select('id').eq('slug', slug).maybeSingle()
      if (clash) slug += '-' + Math.random().toString(36).slice(2, 6)
    }
    const row = {
      name, title, slug,
      image_url: g('image_url'),
      description: g('description'),
      button_text: g('button_text') || 'Перейти в Telegram',
      broadcast_id: formData.get('broadcast_id') ? Number(formData.get('broadcast_id')) : null,
      pixel_id: (g('pixel_id') || '').replace(/\D/g, '') || null,
      collect_phone: formData.get('collect_phone') === 'on',
      active: formData.get('active') === 'on',
    }
    if (isNew) await supabaseAdmin.from('landings').insert(row)
    else await supabaseAdmin.from('landings').update(row).eq('id', Number(id))
    revalidatePath('/admin/funnel/landings')
    if (slug) revalidatePath(`/lp/${slug}`)
    redirect('/admin/funnel/landings')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/admin/funnel/landings" style={{ fontSize: 13, color: '#8a929c', textDecoration: 'none' }}>← Мини-лендинги</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '14px 0 20px' }}>{isNew ? 'Новый лендинг' : 'Редактировать лендинг'}</h1>

      <form action={save} className="form-panel">
        <label style={lbl}>Название (внутреннее)</label>
        <input name="name" defaultValue={l?.name ?? ''} className="admin-input" placeholder="Напр.: Прогрев на клуб — таргет" />

        <ImageField initialUrl={l?.image_url ?? undefined} folder="landings" />

        <label style={lbl}>Заголовок</label>
        <input name="title" defaultValue={l?.title ?? ''} className="admin-input" placeholder="Закрытый бизнес-клуб в Ташкенте" />

        <label style={lbl}>Описание</label>
        <textarea name="description" defaultValue={l?.description ?? ''} rows={4} className="admin-input" style={{ resize: 'vertical' }} placeholder="Собственники и топ-менеджеры компаний, которые ценят окружение своего уровня." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Текст кнопки</label>
            <input name="button_text" defaultValue={l?.button_text ?? 'Перейти в Telegram'} className="admin-input" placeholder="Перейти в Telegram" />
          </div>
          <div>
            <label style={lbl}>Запускать авторассылку</label>
            <select name="broadcast_id" defaultValue={l?.broadcast_id ? String(l.broadcast_id) : ''} className="admin-input">
              <option value="">— не выбрана —</option>
              {broadcasts.map(b => <option key={b.id} value={String(b.id)}>{b.name || `Серия #${b.id}`}</option>)}
            </select>
          </div>
        </div>
        {broadcasts.length === 0 && (
          <p style={{ fontSize: 12, color: '#b87613', margin: '8px 0 0' }}>
            Авторассылок пока нет. Создай серию в разделе <Link href="/admin/funnel/broadcasts" style={{ color: '#00a35c' }}>Авторассылки</Link>, и она появится в списке.
          </p>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: '#3a4250', cursor: 'pointer', marginTop: 18 }}>
          <input type="checkbox" name="collect_phone" defaultChecked={l?.collect_phone === true} style={{ width: 16, height: 16, accentColor: '#00c46f' }} />
          Собирать телефон перед переходом в Telegram
        </label>
        <p style={{ fontSize: 12, color: '#8a929c', margin: '6px 0 0 25px' }}>Если включено — человек сначала вводит номер (попадёт в <b>Базу</b> новым контактом с источником «Лендинг: …»), потом переходит в Telegram по кнопке.</p>

        <label style={lbl}>Facebook Pixel ID</label>
        <input name="pixel_id" defaultValue={l?.pixel_id ?? ''} className="admin-input" inputMode="numeric" placeholder="Например: 123456789012345" />
        <p style={{ fontSize: 12, color: '#8a929c', margin: '6px 0 0' }}>Вставь только ID — код пикселя подставится на лендинг автоматически. При клике на кнопку отправится событие <b>Lead</b>. Оставь пустым, чтобы не подключать.</p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: '#3a4250', cursor: 'pointer', marginTop: 18 }}>
          <input type="checkbox" name="active" defaultChecked={l?.active !== false} style={{ width: 16, height: 16, accentColor: '#00c46f' }} />
          Опубликован (доступен по ссылке)
        </label>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 22 }}>
          <button type="submit" className="admin-btn-primary" style={{ padding: '11px 28px' }}>Сохранить</button>
          <Link href="/admin/funnel/landings" className="admin-btn-ghost">Отмена</Link>
          {!isNew && l?.slug && (
            <a href={`/lp/${l.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn-ghost" style={{ marginLeft: 'auto', borderColor: '#bfe9d2', color: '#00a35c' }}>Открыть ↗</a>
          )}
        </div>
      </form>
    </div>
  )
}
