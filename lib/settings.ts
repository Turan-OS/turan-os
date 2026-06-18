import { supabaseAdmin } from '@/lib/supabase'

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const { data } = await supabaseAdmin.from('settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? fallback
}

export async function setSetting(key: string, value: string) {
  await supabaseAdmin.from('settings').upsert({ key, value })
}
