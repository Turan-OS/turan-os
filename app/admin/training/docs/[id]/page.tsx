import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Document } from '@/lib/supabase'
import DocForm from '../DocForm'

export default async function DocEditPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin/training')

  const { id } = await params
  const isNew = id === 'new'

  let item: Document | null = null
  if (!isNew) {
    const { data } = await supabaseAdmin.from('documents').select('*').eq('id', Number(id)).maybeSingle()
    if (!data) notFound()
    item = data as Document
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/admin/training/docs" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← База знаний</Link>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '14px 0 28px' }}>{isNew ? 'Новый документ' : `Редактировать: ${item?.title}`}</h1>
      <DocForm item={item} />
    </div>
  )
}
