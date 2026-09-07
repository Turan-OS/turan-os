import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import CopyLink from '../../links/CopyLink'
import QrButton from '../../links/QrButton'
import HrKanban from './HrKanban'
import { setCandidateStatus, deleteCandidate } from '../actions'
import type { HrForm, HrCandidate } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

export default async function VacancyBoard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const { data: formData } = await supabaseAdmin.from('hr_forms').select('*').eq('id', Number(id)).maybeSingle()
  const form = formData as HrForm | null
  if (!form) notFound()
  if (user?.role !== 'admin' && form.recruiter_id !== user?.uid) redirect('/admin/hr')

  const { data: candsRaw } = await supabaseAdmin
    .from('hr_candidates').select('*').eq('form_id', form.id).order('created_at', { ascending: false })
  const candidates = (candsRaw ?? []) as HrCandidate[]

  const publicUrl = `${BASE}/job/${form.slug}`

  return (
    <div style={{ maxWidth: 1500 }}>
      <div style={{ marginBottom: 6 }}>
        <Link href="/admin/hr" style={{ fontSize: 13, color: '#127a98', textDecoration: 'none' }}>← Все вакансии</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {form.title}
            {!form.active && <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#8a929c', background: '#eef0f3', border: '1px solid #dde1e7', borderRadius: 5, padding: '3px 8px', marginLeft: 10, verticalAlign: 'middle' }}>закрыта</span>}
          </h1>
          <p style={{ fontSize: 13, color: '#8a929c' }}>{candidates.length} кандидатов</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-ghost" style={{ fontSize: 12.5, padding: '8px 14px' }}>Открыть форму ↗</a>
          <CopyLink url={publicUrl} />
          <QrButton url={publicUrl} slug={form.slug} />
          <Link href={`/admin/hr/${form.id}/edit`} className="admin-btn-ghost" style={{ fontSize: 12.5, padding: '8px 14px' }}>Редактировать</Link>
        </div>
      </div>

      <HrKanban
        formId={form.id}
        items={candidates}
        setStatus={setCandidateStatus}
        remove={deleteCandidate}
      />
    </div>
  )
}
