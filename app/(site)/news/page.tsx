import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'
import { slugifyShort } from '@/lib/slug'
import type { News } from '@/lib/supabase'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Статьи о бухучёте и налогах | TURAN OS',
  description: 'Полезные статьи и разборы о бухгалтерском учёте, налогах, регистрации и ведении бизнеса в Узбекистане от экспертов TURAN OS.',
}

export const revalidate = 60

export default async function NewsPage() {
  const { data } = await supabase.from('news').select('*').order('date', { ascending: false })
  const news: News[] = (data ?? []).filter(n => n.published !== false)  // черновики скрыты
  const showDate = (await getSetting('news_show_date', 'on')) !== 'off'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ marginBottom: 56 }}>
        <div style={{ color: '#1EAAD1', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Полезное
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: 16 }}>
          Статьи и разборы
        </h1>
        <p style={{ color: '#9b98ad', fontSize: 16, maxWidth: 560 }}>
          Бухучёт, налоги, регистрация и ведение бизнеса в Узбекистане — практические материалы от экспертов TURAN OS.
        </p>
      </div>

      {news.length === 0 ? (
        <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Скоро здесь будут новости</div>
          <div style={{ color: '#555' }}>Следите за обновлениями в Telegram и Instagram</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {news.map((n) => (
            <Link key={n.id} href={`/news/${slugifyShort(n.title)}`} style={{ textDecoration: 'none' }}>
              <article style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }} className="news-card">
                {n.image_url && (
                  <div style={{ position: 'relative', paddingBottom: '62%', background: '#0a0a0a' }}>
                    <Image src={n.image_url} alt={n.title} fill sizes="380px" style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 26, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {showDate && <div style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>{n.date}</div>}
                  <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, color: '#fff', lineHeight: 1.35 }}>{n.title}</h2>
                  <p style={{ color: '#777', fontSize: 14, lineHeight: 1.7, flexGrow: 1 }}>{n.description}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <style>{`.news-card{transition:border-color .2s,transform .2s}.news-card:hover{border-color:rgba(0,218,126,0.3);transform:translateY(-3px)}`}</style>
    </div>
  )
}
