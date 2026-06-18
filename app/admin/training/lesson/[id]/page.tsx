import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Lesson } from '@/lib/supabase'
import LessonForm from '../LessonForm'

export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin/training')

  const { id } = await params
  const isNew = id === 'new'

  let item: Lesson | null = null
  if (!isNew) {
    const { data } = await supabaseAdmin.from('lessons').select('*').eq('id', Number(id)).maybeSingle()
    if (!data) notFound()
    item = data as Lesson
  }

  const { data: docs } = await supabaseAdmin.from('documents').select('slug, title').order('title')

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Обучение</Link>
        {!isNew && item?.published && (
          <Link href={`/admin/training/day/${item.day_number}?as=manager`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} title="Посмотреть глазами менеджера">👁 Глазами менеджера</Link>
        )}
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '14px 0 28px' }}>
        {isNew ? 'Новый день' : `Редактировать день ${item?.day_number}: ${item?.title}`}
      </h1>
      <LessonForm item={item} docs={docs ?? []} />
    </div>
  )
}
