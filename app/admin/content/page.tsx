import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { STATUSES, STATUS_META, TYPE_LABEL, normalizeMedia, isVideo, type ContentPost } from '@/lib/content'
import { setStatus } from './actions'

export const dynamic = 'force-dynamic'

export default async function ContentPlanPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await getCurrentUser()
  if (!me || !['admin', 'administrator'].includes(me.role)) {
    return <div style={{ padding: 20, color: '#8a929c' }}>Недостаточно прав.</div>
  }
  const sp = await searchParams
  const filter = sp.status || 'all'

  const { data, error } = await supabaseAdmin.from('content_posts')
    .select('*')
    .order('publish_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>Контент-план</h1>
        <div className="admin-card" style={{ padding: '18px 22px', fontSize: 13.5, color: '#b87613' }}>
          Таблица ещё не создана. Примените миграцию <code>scripts/content-plan.sql</code> к базе — после этого раздел заработает.
        </div>
      </div>
    )
  }

  const posts = (data as ContentPost[]).map(p => ({ ...p, media: normalizeMedia(p.media) }))
  const counts: Record<string, number> = { all: posts.length }
  for (const s of STATUSES) counts[s.key] = posts.filter(p => p.status === s.key).length
  const shown = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Контент-план</h1>
        <Link href="/admin/content/new" className="admin-btn-primary" style={{ padding: '10px 20px', textDecoration: 'none' }}>+ Новый пост</Link>
      </div>

      {/* фильтр по статусам */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
        <Chip href="/admin/content" active={filter === 'all'} label={`Все · ${counts.all}`} />
        {STATUSES.map(s => (
          <Chip key={s.key} href={`/admin/content?status=${s.key}`} active={filter === s.key} label={`${s.label} · ${counts[s.key]}`} color={s.color} bg={s.bg} />
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ fontSize: 14, color: '#aab2bd', padding: '40px 0', textAlign: 'center' }}>
          Пока пусто. Нажмите «+ Новый пост», чтобы запланировать контент.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {shown.map(p => {
            const st = STATUS_META[p.status] ?? STATUS_META.idea
            const cover = p.media[0]
            return (
              <div key={p.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Link href={`/admin/content/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f2f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cover ? (
                      isVideo(cover)
                        ? <video src={cover} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#b7bdc6', fontSize: 12 }}>{TYPE_LABEL[p.type]}</span>
                    )}
                    {cover && isVideo(cover) && (
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</span>
                    )}
                    <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8 }}>
                      {TYPE_LABEL[p.type]}{p.media.length > 1 ? ` · ${p.media.length}` : ''}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px 10px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2329', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title || 'Без темы'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, color: st.color, background: st.bg }}>{st.label}</span>
                      {p.publish_date && <span style={{ fontSize: 12, color: '#8a929c' }}>{new Date(p.publish_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                </Link>
                {/* быстрое утверждение */}
                {p.status !== 'approved' && p.status !== 'published' && (
                  <form action={setStatus} style={{ padding: '0 14px 12px', marginTop: 'auto' }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="admin-btn-ghost" style={{ width: '100%', fontSize: 12, padding: '7px 0', color: '#00955a', borderColor: 'rgba(0,196,111,0.4)' }}>✓ Утвердить</button>
                  </form>
                )}
                {p.status === 'approved' && p.approved_by_name && (
                  <div style={{ padding: '0 14px 12px', fontSize: 11, color: '#00955a' }}>✓ Утвердил: {p.approved_by_name}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chip({ href, active, label, color, bg }: { href: string; active: boolean; label: string; color?: string; bg?: string }) {
  return (
    <Link href={href} style={{
      padding: '7px 13px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, textDecoration: 'none',
      border: `1px solid ${active ? (color ?? '#1EAAD1') : '#e4e7ec'}`,
      background: active ? (bg ?? 'rgba(30,170,209,0.1)') : '#fff',
      color: active ? (color ?? '#127a98') : '#8a929c',
    }}>{label}</Link>
  )
}
