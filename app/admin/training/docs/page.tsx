import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { delDoc } from './actions'

export default async function DocsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin/training')

  const { data: docs } = await supabaseAdmin.from('documents').select('*').order('category').order('title')

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Обучение</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 28px' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>База знаний</h1>
          <p style={{ fontSize: 12, color: '#5b6470' }}>Скрипты и документы — открываются как страницы, на них ссылаются дни обучения</p>
        </div>
        <Link href="/admin/training/docs/new" className="admin-btn-primary">Добавить документ</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs?.map(d => (
          <div key={d.id} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <Link href={`/admin/training/docs/${d.id}`} title="Открыть для редактирования" style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{d.title}</div>
              <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>
                {d.category ? `${d.category} · ` : ''}<code style={{ color: '#127a98' }}>{d.slug}</code>{!d.content ? ' · ⚠️ пусто' : ''}
              </div>
            </Link>
            <Link href={`/admin/training/doc/${d.slug}`} target="_blank" className="admin-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>Открыть ↗</Link>
            <form action={delDoc.bind(null, d.id)}>
              <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
            </form>
          </div>
        ))}
        {!docs?.length && <div className="admin-card" style={{ padding: '40px 24px', textAlign: 'center', color: '#8a929c', fontSize: 14 }}>Документов пока нет.</div>}
      </div>
    </div>
  )
}
