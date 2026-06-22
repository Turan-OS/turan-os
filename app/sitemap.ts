import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { slugifyShort } from '@/lib/slug'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: newsRaw } = await supabaseAdmin
    .from('news')
    .select('id, title, date, published')
    .eq('published', true)
    .order('date', { ascending: false })

  // только опубликованные (черновики отдают 404 — в карту их не включаем)
  const news = newsRaw ?? []

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,     changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/news`, changeFrequency: 'daily',  priority: 0.9 },
  ]

  const newsRoutes: MetadataRoute.Sitemap = news.map(n => ({
    url: `${BASE}/news/${slugifyShort(n.title)}`,
    lastModified: n.date ? new Date(n.date) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...newsRoutes]
}
