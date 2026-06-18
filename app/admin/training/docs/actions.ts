'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { slugify } from '@/lib/slug'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveDoc(formData: FormData) {
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  const id = formData.get('id') as string
  const title = (formData.get('title') as string || '').trim()
  if (!title) return
  const base = {
    title,
    category: formData.get('category') as string || null,
    content:  formData.get('content') as string || null,
  }
  if (id) {
    await supabaseAdmin.from('documents').update(base).eq('id', Number(id))
  } else {
    // уникальный slug из названия
    let slug = slugify(title) || `doc-${Date.now()}`
    const { data: existing } = await supabaseAdmin.from('documents').select('slug').like('slug', `${slug}%`)
    const taken = new Set((existing ?? []).map(d => d.slug))
    if (taken.has(slug)) { let i = 2; while (taken.has(`${slug}-${i}`)) i++; slug = `${slug}-${i}` }
    await supabaseAdmin.from('documents').insert({ ...base, slug })
  }
  revalidatePath('/admin/training/docs')
  redirect('/admin/training/docs')
}

export async function delDoc(id: number) {
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  await supabaseAdmin.from('documents').delete().eq('id', id)
  revalidatePath('/admin/training/docs')
}
