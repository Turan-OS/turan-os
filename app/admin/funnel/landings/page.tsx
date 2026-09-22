import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'

type Landing = {
  id: number; name: string | null; slug: string | null; title: string | null
  image_url: string | null; button_url: string | null; active: boolean | null
  views: number | null; clicks: number | null; created_at: string | null
}

async function delLanding(id: number) {
  'use server'
  await supabaseAdmin.from('landings').delete().eq('id', id)
  revalidatePath('/admin/funnel/landings')
}
async function toggleActive(id: number, next: boolean) {
  'use server'
  await supabaseAdmin.from('landings').update({ active: next }).eq('id', id)
  revalidatePath('/admin/funnel/landings')
}

export default async function LandingsList() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  const { data, error } = await supabaseAdmin.from('landings').select('*').order('created_at', { ascending: false })
  const items = (data as Landing[]) ?? []

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 24px' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Мини-лендинги</h1>
          <p style={{ fontSize: 13, color: '#8a929c' }}>{items.length} страниц</p>
        </div>
        <Link href="/admin/funnel/landings/new" className="admin-btn-primary">Создать</Link>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '18px 22px', color: '#b87613', fontSize: 13.5, marginBottom: 16 }}>
          Таблица лендингов ещё не создана. Примени миграцию <code>scripts/migration-funnel.sql</code> в Supabase → SQL Editor.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(l => {
          const active = l.active !== false
          const conv = l.views ? Math.round(((l.clicks ?? 0) / l.views) * 1000) / 10 : 0
          return (
            <div key={l.id} className="admin-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 14, opacity: active ? 1 : 0.6 }}>
              <div style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f0f2f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {l.image_url ? <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🧲</span>}
              </div>
              <Link href={`/admin/funnel/landings/${l.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{l.name || l.title || 'Без названия'}</div>
                <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>/lp/{l.slug}</div>
              </Link>
              <div style={{ display: 'flex', gap: 16, textAlign: 'center', fontSize: 12, color: '#8a929c' }}>
                <div><div style={{ fontWeight: 700, color: '#1f2329', fontSize: 14 }}>{l.views ?? 0}</div>показы</div>
                <div><div style={{ fontWeight: 700, color: '#1f2329', fontSize: 14 }}>{l.clicks ?? 0}</div>клики</div>
                <div><div style={{ fontWeight: 700, color: '#00a35c', fontSize: 14 }}>{conv}%</div>конв.</div>
              </div>
              <a href={`/lp/${l.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 12px', flexShrink: 0 }} title="Открыть лендинг">Открыть ↗</a>
              <form action={toggleActive.bind(null, l.id, !active)} style={{ flexShrink: 0 }} title={active ? 'Выключить' : 'Включить'}>
                <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <span style={{ width: 34, height: 20, borderRadius: 20, flexShrink: 0, background: active ? '#00c46f' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </span>
                </button>
              </form>
              <form action={delLanding.bind(null, l.id)} style={{ flexShrink: 0 }}>
                <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
              </form>
            </div>
          )
        })}
        {!error && items.length === 0 && (
          <div className="admin-card" style={{ textAlign: 'center', padding: '56px 20px', color: '#8a929c', fontSize: 13 }}>
            Лендингов пока нет — создай первый.
          </div>
        )}
      </div>
    </div>
  )
}
