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
  if (next) {
    // публикация подразумевает утверждение. Дату публикации ставим один раз —
    // при первом опубликовании (чтобы повторная публикация её не сбивала).
    const { data } = await supabaseAdmin.from('news').select('published_at').eq('id', id).maybeSingle()
    const patch: Record<string, unknown> = { published: true, approved: true }
    if (!data?.published_at) {
      const now = new Date()
      patch.published_at = now.toISOString()
      patch.date = now.toISOString().slice(0, 10)
    }
    await supabaseAdmin.from('news').update(patch).eq('id', id)
  } else {
    // снятие с публикации сохраняет дату публикации и утверждение
    await supabaseAdmin.from('news').update({ published: false }).eq('id', id)
  }
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
  const now = new Date()
  if (id) {
    // при первой публикации из редактора ставим дату публикации = сегодня
    let firstPublish = {}
    if (published) {
      const { data } = await supabaseAdmin.from('news').select('published_at').eq('id', Number(id)).maybeSingle()
      if (!data?.published_at) firstPublish = { published_at: now.toISOString(), date: now.toISOString().slice(0, 10) }
    }
    await supabaseAdmin.from('news').update({ ...base, ...firstPublish }).eq('id', Number(id))
  } else {
    // дата = сегодня; если сразу публикуем — фиксируем и дату публикации
    const date = now.toISOString().slice(0, 10)
    await supabaseAdmin.from('news').insert({ ...base, date, ...(published ? { published_at: now.toISOString() } : {}) })
  }
  revalidatePath('/admin/news'); revalidatePath('/news'); revalidatePath('/')
  redirect('/admin/news')
}
