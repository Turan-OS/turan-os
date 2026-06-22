'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteNews(id: number) {
  await supabaseAdmin.from('news').delete().eq('id', id)
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
}

// Утверждение редактором (отдельно от публикации). Утверждённая, но не
// опубликованная статья — готова, но пока не на сайте.
export async function toggleNewsApproved(id: number, next: boolean) {
  await supabaseAdmin.from('news').update({ approved: next }).eq('id', id)
  revalidatePath('/admin/news')
}

export async function toggleNewsPublished(id: number, next: boolean) {
  // публикация подразумевает утверждение; снятие с публикации утверждение сохраняет
  const patch = next ? { published: true, approved: true } : { published: false }
  await supabaseAdmin.from('news').update(patch).eq('id', id)
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
}

export async function saveNews(formData: FormData) {
  const id = formData.get('id') as string
  const published = formData.get('published') === 'on'
  const base = {
    title:       formData.get('title') as string,
    description: formData.get('description') as string,
    content:     formData.get('content') as string || null,
    image_url:   formData.get('image_url') as string || null,
    published,
    // публикация подразумевает утверждение (инвариант: published ⇒ approved)
    ...(published ? { approved: true } : {}),
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
