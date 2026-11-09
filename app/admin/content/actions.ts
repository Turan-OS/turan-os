'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import type { ContentStatus, ContentType } from '@/lib/content'

const CONTENT_ROLES = ['admin', 'administrator']

async function guard() {
  const me = await getCurrentUser()
  if (!me || !CONTENT_ROLES.includes(me.role)) return null
  return me
}

function parseFields(fd: FormData) {
  let media: string[] = []
  try {
    const raw = JSON.parse((fd.get('media') as string) || '[]')
    if (Array.isArray(raw)) media = raw.filter((x: unknown): x is string => typeof x === 'string' && !!x)
  } catch { /* пусто */ }
  return {
    title: ((fd.get('title') as string) || '').trim().slice(0, 300),
    description: ((fd.get('description') as string) || '').trim().slice(0, 4000),
    caption: ((fd.get('caption') as string) || '').trim().slice(0, 4000),
    type: (((fd.get('type') as string) || 'carousel') as ContentType),
    status: (((fd.get('status') as string) || 'idea') as ContentStatus),
    publish_date: ((fd.get('publish_date') as string) || '') || null,
    media,
  }
}

export async function createPost(fd: FormData) {
  const me = await guard(); if (!me) return
  const f = parseFields(fd)
  const { data } = await supabaseAdmin.from('content_posts').insert({
    ...f, created_by: me.uid, created_by_name: me.name,
  }).select('id').single()
  revalidatePath('/admin/content')
  if (data?.id) redirect(`/admin/content/${data.id}`)
  redirect('/admin/content')
}

export async function updatePost(fd: FormData) {
  const me = await guard(); if (!me) return
  const id = Number(fd.get('id'))
  if (!id) return
  const f = parseFields(fd)
  await supabaseAdmin.from('content_posts')
    .update({ ...f, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${id}`)
}

export async function setStatus(fd: FormData) {
  const me = await guard(); if (!me) return
  const id = Number(fd.get('id'))
  const status = (fd.get('status') as string) as ContentStatus
  if (!id || !status) return
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') {
    patch.approved_by = me.uid; patch.approved_by_name = me.name; patch.approved_at = new Date().toISOString()
  } else {
    // снятие утверждения — очищаем подпись утвердившего
    patch.approved_by = null; patch.approved_by_name = null; patch.approved_at = null
  }
  await supabaseAdmin.from('content_posts').update(patch).eq('id', id)
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${id}`)
}

export async function deletePost(fd: FormData) {
  const me = await guard(); if (!me) return
  const id = Number(fd.get('id'))
  if (!id) return
  await supabaseAdmin.from('content_posts').delete().eq('id', id)
  revalidatePath('/admin/content')
  redirect('/admin/content')
}
