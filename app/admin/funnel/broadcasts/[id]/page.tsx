import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'
import BroadcastBoard, { type Step } from './BroadcastBoard'

type Broadcast = { id: number; name: string | null; active: boolean | null }

export default async function BroadcastEditor({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  const { id } = await params
  const bid = Number(id)

  const { data: bData } = await supabaseAdmin.from('broadcasts').select('*').eq('id', bid).maybeSingle()
  if (!bData) notFound()
  const b = bData as Broadcast

  const { data: stepsData } = await supabaseAdmin.from('broadcast_steps').select('*').eq('broadcast_id', bid).order('position').order('id')
  const steps = (stepsData as Step[]) ?? []
  const stepIds = steps.map(s => s.id)

  // ── сводка по подписчикам + отправлено по шагам ──
  const [started, active, done, stopped, logsRes] = await Promise.all([
    supabaseAdmin.from('broadcast_subscribers').select('*', { count: 'exact', head: true }).eq('broadcast_id', bid),
    supabaseAdmin.from('broadcast_subscribers').select('*', { count: 'exact', head: true }).eq('broadcast_id', bid).eq('status', 'active'),
    supabaseAdmin.from('broadcast_subscribers').select('*', { count: 'exact', head: true }).eq('broadcast_id', bid).eq('status', 'done'),
    supabaseAdmin.from('broadcast_subscribers').select('*', { count: 'exact', head: true }).eq('broadcast_id', bid).eq('status', 'stopped'),
    stepIds.length ? supabaseAdmin.from('broadcast_send_log').select('step_id').in('step_id', stepIds).eq('ok', true).limit(200000) : Promise.resolve({ data: [] }),
  ])
  const stats = { started: started.count ?? 0, active: active.count ?? 0, done: done.count ?? 0, stopped: stopped.count ?? 0 }
  const sentByStep: Record<number, number> = {}
  for (const l of (logsRes.data as { step_id: number }[] | null) ?? []) sentByStep[l.step_id] = (sentByStep[l.step_id] ?? 0) + 1

  // ── actions ──
  async function renameBroadcast(formData: FormData) {
    'use server'
    await supabaseAdmin.from('broadcasts').update({ name: ((formData.get('name') as string) ?? '').trim() || 'Без названия' }).eq('id', bid)
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }
  async function toggleActive() {
    'use server'
    const { data } = await supabaseAdmin.from('broadcasts').select('active').eq('id', bid).maybeSingle()
    const cur = data?.active !== false
    await supabaseAdmin.from('broadcasts').update({ active: !cur }).eq('id', bid)
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }
  async function addStep() {
    'use server'
    const { data: last } = await supabaseAdmin.from('broadcast_steps').select('position').eq('broadcast_id', bid).order('position', { ascending: false }).limit(1).maybeSingle()
    const pos = (last?.position ?? -1) + 1
    await supabaseAdmin.from('broadcast_steps').insert({ broadcast_id: bid, position: pos, delay_value: 1, delay_unit: 'days' })
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }
  async function saveStep(formData: FormData) {
    'use server'
    const sid = Number(formData.get('step_id'))
    const g = (k: string) => ((formData.get(k) as string) ?? '').trim() || null
    const patch: Record<string, unknown> = {
      name: g('name'),
      delay_value: Math.max(0, Number(formData.get('delay_value')) || 0),
      delay_unit: (formData.get('delay_unit') as string) || 'days',
      send_time: g('send_time'),
      text: g('text'), image_url: g('image_url'), video_url: g('video_url'),
      button_text: g('button_text'), button_url: g('button_url'),
    }
    const { error } = await supabaseAdmin.from('broadcast_steps').update(patch).eq('id', sid)
    // колонки send_time ещё нет (миграция не выполнена) → повторяем без неё
    if (error && /send_time/i.test(error.message)) {
      delete patch.send_time
      await supabaseAdmin.from('broadcast_steps').update(patch).eq('id', sid)
    }
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }
  async function delStep(sid: number) {
    'use server'
    await supabaseAdmin.from('broadcast_steps').delete().eq('id', sid)
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }
  async function moveStep(sid: number, dir: 'up' | 'down') {
    'use server'
    const { data: all } = await supabaseAdmin.from('broadcast_steps').select('id, position').eq('broadcast_id', bid).order('position').order('id')
    const list = (all as { id: number; position: number }[]) ?? []
    const i = list.findIndex(s => s.id === sid)
    const j = dir === 'up' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= list.length) return
    await supabaseAdmin.from('broadcast_steps').update({ position: list[j].position }).eq('id', list[i].id)
    await supabaseAdmin.from('broadcast_steps').update({ position: list[i].position }).eq('id', list[j].id)
    revalidatePath(`/admin/funnel/broadcasts/${bid}`)
  }

  return (
    <BroadcastBoard
      name={b.name ?? 'Без названия'}
      active={b.active !== false}
      steps={steps}
      stats={stats}
      sentByStep={sentByStep}
      renameBroadcast={renameBroadcast}
      toggleActive={toggleActive}
      addStep={addStep}
      saveStep={saveStep}
      delStep={delStep}
      moveStep={moveStep}
    />
  )
}
