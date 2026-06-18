import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { mdToHtml } from '@/lib/markdown'
import { isScript, parseScript } from '@/lib/scriptDoc'
import ScriptDoc from '../../ScriptDoc'
import DocCopy from './DocCopy'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'

export default async function DocReader({ params }: { params: Promise<{ slug: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  const { slug } = await params

  const { data: doc } = await supabaseAdmin.from('documents').select('*').eq('slug', slug).maybeSingle()
  if (!doc) notFound()

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Обучение</Link>
      {doc.category && <div style={{ fontSize: 11, color: '#8a929c', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '14px 0 6px' }}>{doc.category}</div>}
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: doc.category ? '0 0 24px' : '14px 0 24px' }}>{doc.title}</h1>
      {!doc.content
        ? <div className="admin-card" style={{ padding: '32px 24px', textAlign: 'center', color: '#8a929c', fontSize: 14 }}>Документ пока пустой.</div>
        : isScript(doc.content)
          ? <ScriptDoc data={parseScript(doc.content)} />
          : <><div className="lesson-prose" dangerouslySetInnerHTML={{ __html: mdToHtml(doc.content) }} /><DocCopy /></>}
    </div>
  )
}
