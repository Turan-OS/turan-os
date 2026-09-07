import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import FormBuilder from '../../FormBuilder'
import { updateForm } from '../../actions'
import type { HrForm } from '@/lib/supabase'

export default async function EditVacancy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const { data } = await supabaseAdmin.from('hr_forms').select('*').eq('id', Number(id)).maybeSingle()
  const form = data as HrForm | null
  if (!form) notFound()
  // рекрутер редактирует только свои вакансии
  if (user?.role !== 'admin' && form.recruiter_id !== user?.uid) redirect('/admin/hr')

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 18 }}>
        <Link href={`/admin/hr/${form.id}`} style={{ fontSize: 13, color: '#127a98', textDecoration: 'none' }}>← К вакансии</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>Редактировать вакансию</h1>
      </div>
      <FormBuilder
        action={updateForm.bind(null, form.id)}
        initial={{ title: form.title, description: form.description, questions: form.questions, active: form.active }}
        isEdit
        submitLabel="Сохранить"
      />
    </div>
  )
}
