'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteNews(id: number) {
  await supabaseAdmin.from('news').delete().eq('id', id)
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
}

export async function toggleNewsPublished(id: number, next: boolean) {
  await supabaseAdmin.from('news').update({ published: next }).eq('id', id)
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
}

export async function saveNews(formData: FormData) {
  const id = formData.get('id') as string
  const base = {
    title:       formData.get('title') as string,
    description: formData.get('description') as string,
    content:     formData.get('content') as string || null,
    image_url:   formData.get('image_url') as string || null,
    published:   formData.get('published') === 'on',
  }
  if (id) {
    await supabaseAdmin.from('news').update(base).eq('id', Number(id))
  } else {
    // дата ставится автоматически
    const date = new Date().toISOString().slice(0, 10)
    await supabaseAdmin.from('news').insert({ ...base, date })
  }
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
  redirect('/admin/news')
}
