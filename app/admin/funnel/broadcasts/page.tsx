import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'

type Broadcast = { id: number; name: string | null; active: boolean | null; created_at: string | null }

async function createBroadcast(formData: FormData) {
  'use server'
  const name = ((formData.get('name') as string) ?? '').trim() || 'Новая авторассылка'
  const { data } = await supabaseAdmin.from('broadcasts').insert({ name, active: true }).select('id').single()
  if (data?.id) redirect(`/admin/funnel/broadcasts/${data.id}`)
}
async function toggleBroadcast(id: number, next: boolean) {
  'use server'
  await supabaseAdmin.from('broadcasts').update({ active: next }).eq('id', id)
  revalidatePath('/admin/funnel/broadcasts')
}
async function delBroadcast(id: number) {
  'use server'
  await supabaseAdmin.from('broadcasts').delete().eq('id', id)
  revalidatePath('/admin/funnel/broadcasts')
}

export default async function BroadcastsList() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  const { data, error } = await supabaseAdmin.from('broadcasts').select('*').order('created_at', { ascending: false })
  const items = (data as Broadcast[]) ?? []
  // число шагов по каждой рассылке
  const counts = new Map<number, number>()
  if (items.length) {
    const { data: steps } = await supabaseAdmin.from('broadcast_steps').select('broadcast_id').in('broadcast_id', items.map(b => b.id))
    for (const s of steps ?? []) counts.set(s.broadcast_id as number, (counts.get(s.broadcast_id as number) ?? 0) + 1)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '0 0 24px', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Авторассылки</h1>
          <p style={{ fontSize: 13, color: '#8a929c' }}>{items.length} серий · прогрев в Telegram по шагам</p>
        </div>
        <form action={createBroadcast} style={{ display: 'flex', gap: 8 }}>
          <input name="name" placeholder="Название серии" className="admin-input" style={{ maxWidth: 220 }} />
          <button type="submit" className="admin-btn-primary" style={{ whiteSpace: 'nowrap' }}>Создать</button>
        </form>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '18px 22px', color: '#b87613', fontSize: 13.5, marginBottom: 16 }}>
          Таблицы авторассылок ещё нет. Примени миграцию <code>scripts/migration-funnel.sql</code> в Supabase → SQL Editor.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(b => {
          const active = b.active !== false
          return (
            <div key={b.id} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: active ? 1 : 0.6 }}>
              <span style={{ fontSize: 22 }}>✉️</span>
              <Link href={`/admin/funnel/broadcasts/${b.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name || 'Без названия'}</div>
                <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>{counts.get(b.id) ?? 0} шагов</div>
              </Link>
              <form action={toggleBroadcast.bind(null, b.id, !active)} title={active ? 'Остановить' : 'Запустить'}>
                <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <span style={{ width: 34, height: 20, borderRadius: 20, background: active ? '#00c46f' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </span>
                </button>
              </form>
              <form action={delBroadcast.bind(null, b.id)}>
                <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
              </form>
            </div>
          )
        })}
        {!error && items.length === 0 && (
          <div className="admin-card" style={{ textAlign: 'center', padding: '56px 20px', color: '#8a929c', fontSize: 13 }}>
            Серий пока нет — создай первую (название сверху → «Создать»).
          </div>
        )}
      </div>
    </div>
  )
}
