import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { HR_STAGES } from '@/lib/hrStages'
import type { HrForm } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

export default async function HrHome() {
  const user = await getCurrentUser()
  if (!user) return null
  const isAdmin = user.role === 'admin'

  let q = supabaseAdmin.from('hr_forms').select('*').order('created_at', { ascending: false })
  if (!isAdmin) q = q.eq('recruiter_id', user.uid)
  const { data: formsRaw } = await q
  const forms = (formsRaw ?? []) as HrForm[]

  // счётчики кандидатов по вакансиям
  const ids = forms.map(f => f.id)
  const counts: Record<number, { total: number; active: number }> = {}
  if (ids.length) {
    const { data: cands } = await supabaseAdmin.from('hr_candidates').select('form_id, status').in('form_id', ids)
    for (const c of cands ?? []) {
      const e = counts[c.form_id] ??= { total: 0, active: 0 }
      e.total++
      if (c.status !== 'rejected' && c.status !== 'hired') e.active++
    }
  }

  return (
    <div style={{ maxWidth: 940 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Рекрутинг</h1>
          <p style={{ fontSize: 12.5, color: '#5b6470' }}>
            {isAdmin ? 'Все вакансии команды' : 'Ваши вакансии'} · {forms.length}
          </p>
        </div>
        <Link href="/admin/hr/new" className="admin-btn-primary">+ Вакансия</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {forms.map(f => {
          const c = counts[f.id] ?? { total: 0, active: 0 }
          return (
            <Link key={f.id} href={`/admin/hr/${f.id}`} className="admin-card" style={{ padding: 16, textDecoration: 'none', color: 'inherit', display: 'block', borderLeft: `3px solid ${f.active ? '#1EAAD1' : '#cbd2da'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#1f2329', lineHeight: 1.3 }}>{f.title}</span>
                {!f.active && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8a929c', background: '#eef0f3', border: '1px solid #dde1e7', borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>закрыта</span>}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: '#5b6470', marginBottom: 12 }}>
                <span><b style={{ color: '#127a98' }}>{c.total}</b> кандидат{c.total % 10 === 1 && c.total % 100 !== 11 ? '' : 'ов'}</span>
                <span><b style={{ color: '#0a7d44' }}>{c.active}</b> в работе</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#8a929c', wordBreak: 'break-all' }}>{BASE.replace(/^https?:\/\//, '')}/job/{f.slug}</div>
            </Link>
          )
        })}
      </div>

      {!forms.length && (
        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 24px', color: '#8a929c', fontSize: 13.5, lineHeight: 1.6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#3a4250', marginBottom: 6 }}>Пока нет вакансий</div>
          Создайте первую вакансию с формой — получите публичную ссылку, кандидаты попадут в канбан.<br />
          <Link href="/admin/hr/new" className="admin-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>+ Создать вакансию</Link>
          <div style={{ fontSize: 11.5, marginTop: 18, color: '#aab2bd' }}>Этапы найма: {HR_STAGES.map(s => s.title).join(' → ')}</div>
        </div>
      )}
    </div>
  )
}
