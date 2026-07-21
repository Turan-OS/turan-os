'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// slug → только строчные буквы/цифры/дефис
function cleanSlug(raw: string): string {
  return (raw || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// target → абсолютный URL (добавляем https:// если схемы нет)
function cleanTarget(raw: string): string {
  const t = (raw || '').trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export async function createLink(formData: FormData) {
  const slug = cleanSlug(formData.get('slug') as string)
  const target = cleanTarget(formData.get('target_url') as string)
  if (!slug || !target) return
  await supabaseAdmin.from('short_links').insert({ slug, target_url: target })
  revalidatePath('/admin/links')
}

export async function updateLinkTarget(id: number, formData: FormData) {
  const target = cleanTarget(formData.get('target_url') as string)
  if (!target) return
  await supabaseAdmin.from('short_links').update({ target_url: target }).eq('id', id)
  revalidatePath('/admin/links')
}

export async function deleteLink(id: number) {
  await supabaseAdmin.from('short_links').delete().eq('id', id)
  revalidatePath('/admin/links')
}
