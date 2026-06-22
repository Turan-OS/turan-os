import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { slugifyShort } from '@/lib/slug'
import { deleteNews, toggleNewsPublished } from './actions'

export default async function AdminNews() {
  const { data: items } = await supabaseAdmin.from('news').select('*').order('date', { ascending: false })

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Новости</h1>
          <p style={{ fontSize: 12, color: '#5b6470' }}>{items?.length ?? 0} записей</p>
        </div>
        <Link href="/admin/news/new" className="admin-btn-primary">Добавить</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items?.map(n => {
          const published = n.published !== false
          return (
          <div key={n.id} className="admin-card admin-row-click" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 14, opacity: published ? 1 : 0.6 }}>
            <Link href={`/admin/news/${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ position: 'relative', width: 72, height: 54, borderRadius: 8, overflow: 'hidden', background: '#f0f2f5', flexShrink: 0 }}>
                {n.image_url
                  ? <Image src={n.image_url} alt="" fill sizes="72px" style={{ objectFit: 'cover', filter: published ? 'none' : 'grayscale(1)' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📰</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, background: published ? 'rgba(30,170,209,0.12)' : '#eef0f3', color: published ? '#127a98' : '#8a929c', border: `1px solid ${published ? 'rgba(30,170,209,0.3)' : '#dde1e7'}` }}>{published ? 'Опубликовано' : 'Черновик'}</span>
                  <span style={{ fontSize: 12, color: '#8a929c' }}>{n.date}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35, marginBottom: 2 }}>{n.title}</p>
                <p style={{ fontSize: 12, color: '#8a929c', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{n.description}</p>
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
            <form action={toggleNewsPublished.bind(null, n.id, !published)} style={{ flexShrink: 0 }} title={published ? 'Снять с публикации' : 'Опубликовать'}>
              <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                <span style={{ width: 34, height: 20, borderRadius: 20, flexShrink: 0, background: published ? '#1EAAD1' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: published ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </span>
              </button>
            </form>
            <form action={deleteNews.bind(null, n.id)} style={{ flexShrink: 0 }}>
              <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
            </form>
          </div>
          )
        })}
        {!items?.length && <div className="admin-card" style={{ textAlign: 'center', padding: '64px 20px', color: '#8a929c', fontSize: 13 }}>Новостей пока нет</div>}
      </div>
    </div>
  )
}
