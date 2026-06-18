'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Material } from '@/lib/supabase'

export async function saveLesson(formData: FormData) {
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  const id = formData.get('id') as string
  let materials: Material[] = []
  try { materials = JSON.parse((formData.get('materials') as string) || '[]') } catch {}
  const payload = {
    day_number: Number(formData.get('day_number') || 1),
    title:      formData.get('title') as string,
    content:    formData.get('content') as string || null,
    video_url:  formData.get('video_url') as string || null,
    homework:   formData.get('homework') as string || null,
    materials,
    published:  formData.get('published') === 'on',
  }
  if (id) await supabaseAdmin.from('lessons').update(payload).eq('id', Number(id))
  else    await supabaseAdmin.from('lessons').insert(payload)
  revalidatePath('/admin/training')
  redirect('/admin/training')
}

export async function delLesson(id: number) {
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  await supabaseAdmin.from('lessons').delete().eq('id', id)
  revalidatePath('/admin/training')
}
