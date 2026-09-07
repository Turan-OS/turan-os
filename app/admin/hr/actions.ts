'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { slugifyShort } from '@/lib/slug'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { HrQuestion } from '@/lib/hrStages'

// уникальный slug (на основе заголовка/поля), с суффиксом при конфликте
async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let root = slugifyShort(base || 'vakansiya') || 'vakansiya'
  const { data } = await supabaseAdmin.from('hr_forms').select('id, slug')
  const taken = new Set((data ?? []).filter(f => f.id !== ignoreId).map(f => f.slug))
  if (!taken.has(root)) return root
  for (let i = 2; i < 999; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`
  return `${root}-${Date.now()}`
}

function parseQuestions(raw: string): HrQuestion[] {
  try {
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr
      .filter((q) => q && q.label)
      .map((q, i): HrQuestion => ({
        key: (q.key || `q${i + 1}`).toString().slice(0, 40),
        label: q.label.toString().slice(0, 200),
        type: ['text', 'textarea', 'phone', 'email', 'select', 'number'].includes(q.type) ? q.type : 'text',
        required: !!q.required,
        options: Array.isArray(q.options) ? q.options.map((o: unknown) => String(o).slice(0, 100)).filter(Boolean) : undefined,
      }))
  } catch { return [] }
}

export async function createForm(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return
  const title = ((formData.get('title') as string) || '').trim().slice(0, 160)
  if (!title) return
  const description = ((formData.get('description') as string) || '').trim().slice(0, 2000)
  const questions = parseQuestions(formData.get('questions') as string)
  const slug = await uniqueSlug((formData.get('slug') as string) || title)

  const { data } = await supabaseAdmin.from('hr_forms')
    .insert({ title, slug, description, questions, recruiter_id: user.uid, active: true })
    .select('id').single()

  revalidatePath('/admin/hr')
  redirect(data ? `/admin/hr/${data.id}` : '/admin/hr')
}

export async function updateForm(id: number, formData: FormData) {
  const title = ((formData.get('title') as string) || '').trim().slice(0, 160)
  if (!title) return
  const description = ((formData.get('description') as string) || '').trim().slice(0, 2000)
  const questions = parseQuestions(formData.get('questions') as string)
  const active = formData.get('active') === 'on'
  await supabaseAdmin.from('hr_forms').update({ title, description, questions, active }).eq('id', id)
  revalidatePath('/admin/hr'); revalidatePath(`/admin/hr/${id}`)
  redirect(`/admin/hr/${id}`)
}

export async function deleteForm(id: number) {
  await supabaseAdmin.from('hr_forms').delete().eq('id', id)
  revalidatePath('/admin/hr')
  redirect('/admin/hr')
}

export async function setCandidateStatus(id: number, status: string) {
  await supabaseAdmin.from('hr_candidates').update({ status }).eq('id', id)
}

export async function deleteCandidate(id: number) {
  await supabaseAdmin.from('hr_candidates').delete().eq('id', id)
}

export async function updateCandidateNotes(id: number, formId: number, formData: FormData) {
  const notes = ((formData.get('notes') as string) || '').slice(0, 5000)
  await supabaseAdmin.from('hr_candidates').update({ notes }).eq('id', id)
  revalidatePath(`/admin/hr/candidate/${id}`); revalidatePath(`/admin/hr/${formId}`)
}

// ручное добавление кандидата рекрутером
export async function addCandidate(formId: number, recruiterId: number | null | undefined, formData: FormData) {
  const name = ((formData.get('name') as string) || '').trim().slice(0, 200)
  const contact = ((formData.get('contact') as string) || '').trim().slice(0, 200)
  if (!name && !contact) return
  await supabaseAdmin.from('hr_candidates').insert({
    form_id: formId, recruiter_id: recruiterId ?? null, name: name || null, contact: contact || null,
    answers: {}, status: 'new',
  })
  revalidatePath(`/admin/hr/${formId}`)
}
