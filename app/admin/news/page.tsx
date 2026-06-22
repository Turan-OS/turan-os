import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { slugifyShort } from '@/lib/slug'
import { deleteNews, toggleNewsPublished } from './actions'

// Редакционный статус новости (вычисляется из content + published, без отдельного поля в БД):
//  empty     — добавлен только заголовок, текста ещё нет (пишет ИИ)
//  review    — текст написан, ждёт утверждения человеком
//  published — утверждено и опубликовано на сайте
type NewsState = 'empty' | 'review' | 'published'
function newsState(n: { content?: string | null; published?: boolean | null }): NewsState {
  if (n.published !== false) return 'published'
  return (n.content ?? '').trim().length > 0 ? 'review' : 'empty'
}
const BADGE: Record<NewsState, { label: string; bg: string; color: string; border: string }> = {
  published: { label: 'Опубликовано',     bg: 'rgba(30,170,209,0.12)', color: '#127a98', border: 'rgba(30,170,209,0.3)' },
  review:    { label: 'На проверке',       bg: 'rgba(245,166,35,0.16)', color: '#b5740a', border: 'rgba(245,166,35,0.45)' },
  empty:     { label: 'Только заголовок',  bg: '#eef0f3',               color: '#8a929c', border: '#dde1e7' },
}

export default async function AdminNews() {
  const { data } = await supabaseAdmin.from('news').select('*').order('date', { ascending: false })
  const items = data ?? []

  const counts = { published: 0, review: 0, empty: 0 }
  for (const n of items) counts[newsState(n)]++

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Новости</h1>
          <p style={{ fontSize: 12.5, color: '#5b6470', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{items.length} записей</span>
            <span style={{ color: '#dde1e7' }}>·</span>
            <span><b style={{ color: '#127a98' }}>{counts.published}</b> опубликовано</span>
            <span><b style={{ color: '#b5740a' }}>{counts.review}</b> на проверке</span>
            <span><b style={{ color: '#8a929c' }}>{counts.empty}</b> без текста</span>
          </p>
        </div>
        <Link href="/admin/news/new" className="admin-btn-primary">Добавить</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(n => {
          const state = newsState(n)
          const badge = BADGE[state]
          const published = state === 'published'
          const hasContent = (n.content ?? '').trim().length > 0
          return (
          <div key={n.id} className="admin-card admin-row-click" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 14, opacity: state === 'empty' ? 0.7 : 1, borderLeft: `3px solid ${badge.color}` }}>
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
            {hasContent ? (
              <form action={toggleNewsPublished.bind(null, n.id, !published)} style={{ flexShrink: 0 }} title={published ? 'Снять с публикации' : 'Утвердить и опубликовать'}>
                <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <span style={{ width: 34, height: 20, borderRadius: 20, flexShrink: 0, background: published ? '#1EAAD1' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: published ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </span>
                </button>
              </form>
            ) : (
              <span style={{ flexShrink: 0, display: 'inline-flex' }} title="Сначала добавьте текст статьи">
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
        {!items.length && <div className="admin-card" style={{ textAlign: 'center', padding: '64px 20px', color: '#8a929c', fontSize: 13 }}>Новостей пока нет</div>}
      </div>
    </div>
  )
}
