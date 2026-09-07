import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import StatusPicker from './StatusPicker'
import { updateCandidateNotes } from '../../actions'
import type { HrForm, HrCandidate } from '@/lib/supabase'

const box: React.CSSProperties = { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 20 }

export default async function CandidatePage({ params }: { params: Promise<{ cid: string }> }) {
  const { cid } = await params
  const user = await getCurrentUser()
  const { data: candData } = await supabaseAdmin.from('hr_candidates').select('*').eq('id', Number(cid)).maybeSingle()
  const cand = candData as HrCandidate | null
  if (!cand) notFound()

  const { data: formData } = await supabaseAdmin.from('hr_forms').select('*').eq('id', cand.form_id).maybeSingle()
  const form = formData as HrForm | null
  if (user?.role !== 'admin' && form?.recruiter_id !== user?.uid) redirect('/admin/hr')

  const created = cand.created_at ? new Date(cand.created_at).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 14 }}>
        <Link href={`/admin/hr/${cand.form_id}`} style={{ fontSize: 13, color: '#127a98', textDecoration: 'none' }}>← {form?.title ?? 'К вакансии'}</Link>
      </div>

      <div style={{ ...box, marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{cand.name || 'Без имени'}</h1>
        {cand.contact && <div style={{ fontSize: 15, color: '#127a98', fontWeight: 600, marginBottom: 4 }}>{cand.contact}</div>}
        <div style={{ fontSize: 12.5, color: '#8a929c' }}>Отклик: {created}</div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#5b6470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Этап</div>
          <StatusPicker id={cand.id} status={cand.status} />
        </div>
      </div>

      {/* Ответы на вопросы формы */}
      <div style={{ ...box, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Ответы кандидата</div>
        {(form?.questions ?? []).length === 0 && Object.keys(cand.answers || {}).length === 0 ? (
          <div style={{ fontSize: 13, color: '#8a929c' }}>В форме не было доп. вопросов.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(form?.questions ?? []).map(qn => {
              const val = cand.answers?.[qn.key]
              return (
                <div key={qn.key}>
                  <div style={{ fontSize: 12.5, color: '#8a929c', marginBottom: 3 }}>{qn.label}</div>
                  <div style={{ fontSize: 14, color: '#1f2329', whiteSpace: 'pre-wrap' }}>{val ? String(val) : <span style={{ color: '#c2c8d0' }}>—</span>}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Заметки рекрутера */}
      <form action={updateCandidateNotes.bind(null, cand.id, cand.form_id)} style={box}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Заметки</div>
        <textarea name="notes" defaultValue={cand.notes} rows={4} placeholder="Комментарии по кандидату, итоги интервью…"
          style={{ width: '100%', padding: '11px 13px', background: '#fff', border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
        <button type="submit" className="admin-btn-primary" style={{ marginTop: 12, fontSize: 13 }}>Сохранить заметки</button>
      </form>
    </div>
  )
}
