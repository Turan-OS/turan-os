import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { News } from '@/lib/supabase'
import NewsForm from '../NewsForm'

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === 'new'

  let item: News | null = null
  if (!isNew) {
    const { data } = await supabaseAdmin.from('news').select('*').eq('id', Number(id)).maybeSingle()
    if (!data) notFound()
    item = data as News
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/admin/news" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Все новости</Link>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '14px 0 28px' }}>{isNew ? 'Новая новость' : `Редактировать: ${item?.title}`}</h1>
      <NewsForm item={item} />
    </div>
  )
}
