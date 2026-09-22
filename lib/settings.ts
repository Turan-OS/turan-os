import { supabaseAdmin } from '@/lib/supabase'

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const { data } = await supabaseAdmin.from('settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? fallback
}

export async function setSetting(key: string, value: string) {
  await supabaseAdmin.from('settings').upsert({ key, value })
}

// Ответственный по умолчанию (Настройки). Если не задан — null.
export async function getDefaultResponsible(): Promise<{ id: number; name: string } | null> {
  const raw = await getSetting('default_responsible_id', '')
  if (!raw) return null
  const { data } = await supabaseAdmin.from('users').select('id, name, status').eq('id', Number(raw)).maybeSingle()
  if (!data || data.status !== 'active' || !data.name) return null
  return { id: data.id as number, name: data.name as string }
}
