import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'
import { mdToHtml } from '@/lib/markdown'
import { slugifyShort } from '@/lib/slug'
import type { News } from '@/lib/supabase'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

// Резолвим новость по красивому слагу из заголовка.
// Фолбэк — старые числовые ссылки /news/5 (чтобы не ломать уже расшаренные URL).
async function getNews(slug: string): Promise<News | null> {
  const { data } = await supabase.from('news').select('*').order('date', { ascending: false })
  const list = (data ?? []) as News[]
  return list.find(n => slugifyShort(n.title) === slug)
    ?? (/^\d+$/.test(slug) ? list.find(n => String(n.id) === slug) : undefined)
    ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getNews(slug)
  if (!data) return {}
  const canonical = `/news/${slugifyShort(data.title)}`
  return {
    title: data.title,
    description: data.description,
    alternates: { canonical },
    openGraph: { title: data.title, description: data.description, type: 'article', publishedTime: data.date, images: data.image_url ? [data.image_url] : [] },
  }
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params
  const data = await getNews(slug)
  if (!data || data.published === false) notFound()  // черновик не виден публично
  const prettySlug = slugifyShort(data.title)
  const showDate = (await getSetting('news_show_date', 'on')) !== 'off'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: data.title,
    description: data.description,
    datePublished: data.date,
    image: data.image_url ? [`https://turan-os.local${data.image_url}`] : undefined,
    author: { '@type': 'Organization', name: 'TURAN OS' },
    publisher: {
      '@type': 'Organization',
      name: 'TURAN OS',
      url: 'https://turan-os.local',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://turan-os.local/news/${prettySlug}` },
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32, fontSize: 14, color: '#555' }}>
        <Link href="/" style={{ color: '#555', textDecoration: 'none' }}>Главная</Link>
        <span>/</span>
        <Link href="/news" style={{ color: '#555', textDecoration: 'none' }}>Новости</Link>
      </div>

      {showDate && <div style={{ color: '#1EAAD1', fontSize: 13, marginBottom: 14, fontWeight: 600 }}>{data.date}</div>}
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 28 }}>
        {data.title}
      </h1>

      {data.image_url && (
        <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 36, background: '#0a0a0a', aspectRatio: '16/10' }}>
          <Image src={data.image_url} alt={data.title} fill sizes="800px" style={{ objectFit: 'cover' }} priority />
        </div>
      )}

      {data.content && (
        <div className="prose-dark" dangerouslySetInnerHTML={{ __html: mdToHtml(data.content) }} />
      )}

      <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/news" style={{ color: '#1EAAD1', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          ← Все новости
        </Link>
      </div>
    </div>
  )
}
