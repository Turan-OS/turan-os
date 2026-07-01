import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { slugifyShort } from '@/lib/slug'
import { deleteNews, toggleNewsPublished, toggleNewsApproved } from './actions'

// Редакционный статус новости (из content + approved + published):
//  empty     — добавлен только заголовок, текста ещё нет (пишет ИИ)
//  review    — текст написан, ждёт утверждения человеком
//  approved  — утверждено редактором, но пока не опубликовано (готово, не на сайте)
//  published — опубликовано на сайте
type NewsState = 'empty' | 'review' | 'approved' | 'published'
function newsState(n: { content?: string | null; approved?: boolean | null; published?: boolean | null }): NewsState {
  if (n.published !== false) return 'published'
  const hasContent = (n.content ?? '').trim().length > 0
  if (!hasContent) return 'empty'
  return n.approved ? 'approved' : 'review'
}
const BADGE: Record<NewsState, { label: string; bg: string; color: string; border: string }> = {
  published: { label: 'Опубликовано',     bg: 'rgba(30,170,209,0.12)', color: '#127a98', border: 'rgba(30,170,209,0.3)' },
  approved:  { label: 'Утверждено',        bg: 'rgba(16,160,90,0.13)',  color: '#0a7d44', border: 'rgba(16,160,90,0.38)' },
  review:    { label: 'На проверке',       bg: 'rgba(245,166,35,0.16)', color: '#b5740a', border: 'rgba(245,166,35,0.45)' },
  empty:     { label: 'Только заголовок',  bg: '#eef0f3',               color: '#8a929c', border: '#dde1e7' },
}

export default async function AdminNews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  // сортировка по дате публикации (опубликованные сверху по свежести),
  // затем остальные по дате записи
  const { data } = await supabaseAdmin.from('news').select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('date', { ascending: false })
  const items = data ?? []

  const counts = { published: 0, approved: 0, review: 0, empty: 0 }
  for (const n of items) counts[newsState(n)]++

  // активный фильтр из URL (?status=...); иначе показываем все
  const active = (['published', 'approved', 'review', 'empty'] as const).find(k => k === status) ?? null
  const visible = active ? items.filter(n => newsState(n) === active) : items

  // кликабельные фильтры-счётчики
  const filters: { key: NewsState | null; label: string; count: number; color: string }[] = [
    { key: null,        label: `${items.length} записей`, count: items.length,    color: '#5b6470' },
    { key: 'published', label: 'опубликовано',            count: counts.published, color: '#127a98' },
    { key: 'approved',  label: 'утверждено',              count: counts.approved,  color: '#0a7d44' },
    { key: 'review',    label: 'на проверке',             count: counts.review,    color: '#b5740a' },
    { key: 'empty',     label: 'без текста',              count: counts.empty,     color: '#8a929c' },
  ]

  return (
    <div style={{ maxWidth: 940 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Новости</h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {filters.map(f => {
              const isActive = f.key === active
              return (
                <Link
                  key={f.key ?? 'all'}
                  href={f.key ? `/admin/news?status=${f.key}` : '/admin/news'}
                  style={{
                    textDecoration: 'none', fontSize: 12.5, padding: '4px 10px', borderRadius: 7,
                    border: `1px solid ${isActive ? f.color : 'transparent'}`,
                    background: isActive ? `${f.color}1a` : 'transparent',
                    color: isActive ? f.color : '#5b6470',
                    whiteSpace: 'nowrap', transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {f.key === null
                    ? f.label
                    : <><b style={{ color: f.color }}>{f.count}</b> {f.label}</>}
                </Link>
              )
            })}
          </div>
        </div>
        <Link href="/admin/news/new" className="admin-btn-primary">Добавить</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(n => {
          const state = newsState(n)
          const badge = BADGE[state]
          const published = state === 'published'
          const approved = state === 'approved' || published
          const hasContent = (n.content ?? '').trim().length > 0
          return (
          <div key={n.id} className="admin-card admin-row-click" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, opacity: state === 'empty' ? 0.7 : 1, borderLeft: `3px solid ${badge.color}` }}>
            <Link href={`/admin/news/${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ position: 'relative', width: 72, height: 54, borderRadius: 8, overflow: 'hidden', background: '#f0f2f5', flexShrink: 0 }}>
                {n.image_url
                  ? <Image src={n.image_url} alt="" fill sizes="72px" style={{ objectFit: 'cover', filter: published ? 'none' : 'grayscale(1)' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📰</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{badge.label}</span>
                  <span style={{ fontSize: 12, color: '#8a929c' }}>{n.date}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35, marginBottom: 2 }}>{n.title}</p>
                <p style={{ fontSize: 12, color: '#8a929c', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{n.description || (state === 'empty' ? 'Текста пока нет — добавьте содержание' : '')}</p>
              </div>
            </Link>

            <a
              href={`/news/${slugifyShort(n.title)}${published ? '' : '?preview=1'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-ghost"
              style={{ flexShrink: 0, fontSize: 12, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              title={published ? 'Открыть статью на сайте' : 'Предпросмотр черновика'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              {published ? 'Открыть' : 'Просмотр'}
            </a>

            {/* Утверждение редактором — доступно, пока статья с текстом и не опубликована */}
            {hasContent && !published ? (
              <form action={toggleNewsApproved.bind(null, n.id, !approved)} style={{ flexShrink: 0 }}>
                <button type="submit" className={approved ? 'admin-btn-primary' : 'admin-btn-ghost'}
                  style={{ fontSize: 12, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', ...(approved ? { background: '#0a9a55', boxShadow: 'none' } : {}) }}
                  title={approved ? 'Снять утверждение (вернуть на проверку)' : 'Утвердить статью'}>
                  {approved
                    ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Утверждено</>
                    : 'Утвердить'}
                </button>
              </form>
            ) : (
              <span style={{ flexShrink: 0, width: 1 }} />
            )}

            {/* Публикация — доступна только после утверждения */}
            {approved ? (
              <form action={toggleNewsPublished.bind(null, n.id, !published)} style={{ flexShrink: 0 }} title={published ? 'Снять с публикации' : 'Опубликовать на сайте'}>
                <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <span style={{ width: 34, height: 20, borderRadius: 20, flexShrink: 0, background: published ? '#1EAAD1' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: published ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </span>
                </button>
              </form>
            ) : (
              <span style={{ flexShrink: 0, display: 'inline-flex' }} title={hasContent ? 'Сначала утвердите статью' : 'Сначала добавьте текст'}>
                <span style={{ width: 34, height: 20, borderRadius: 20, flexShrink: 0, background: '#e4e7ec', position: 'relative', cursor: 'not-allowed', opacity: 0.6 }}>
                  <span style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
                </span>
              </span>
            )}

            <form action={deleteNews.bind(null, n.id)} style={{ flexShrink: 0 }}>
              <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
            </form>
          </div>
          )
        })}
        {!visible.length && (
          <div className="admin-card" style={{ textAlign: 'center', padding: '64px 20px', color: '#8a929c', fontSize: 13 }}>
            {active ? <>Нет статей со статусом «{BADGE[active].label}». <Link href="/admin/news" style={{ color: '#127a98' }}>Показать все</Link></> : 'Новостей пока нет'}
          </div>
        )}
      </div>
    </div>
  )
}
