// Единая логика источников для сквозной аналитики.
// Используется и на сайте (/api/apply), и в дашборде «Аналитика».

export type Utm = {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
}

// платные медиумы → «Таргет»
const PAID = ['cpc', 'ppc', 'paid', 'paid_social', 'ads', 'cpm', 'cpv', 'display']
// органические соцсети
const SOCIAL = ['instagram', 'ig', 'telegram', 'tg', 'facebook', 'fb', 'youtube', 'yt', 'tiktok', 'vk']

// Человеко-понятный канал заявки. fromFunnel=true — если человек пришёл через воронку (?tgid).
export function classifyChannel(utm: Utm, fromFunnel = false): string {
  const s = (utm.utm_source || '').toLowerCase().trim()
  const m = (utm.utm_medium || '').toLowerCase().trim()
  if (m && PAID.includes(m)) return 'Таргет'
  if (s && SOCIAL.some(x => s.includes(x))) return 'Соцсети'
  if (s) return s.charAt(0).toUpperCase() + s.slice(1) // прочий помеченный источник
  if (fromFunnel) return 'Воронка'
  return 'Прямой'
}

// Достать utm из строки запроса (?utm_source=…) или из объекта.
export function pickUtm(src: URLSearchParams | Record<string, unknown>): Utm {
  const get = (k: string): string | null => {
    const v = src instanceof URLSearchParams ? src.get(k) : (src[k] as string | undefined)
    const s = (v ?? '').toString().slice(0, 200).trim()
    return s || null
  }
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
  }
}

export const hasUtm = (u: Utm) => !!(u.utm_source || u.utm_medium || u.utm_campaign || u.utm_content)

// Цвета каналов для графиков/бейджей
export const CHANNEL_COLOR: Record<string, string> = {
  'Таргет':  '#3a7bd5',
  'Соцсети': '#00a35c',
  'Воронка': '#b8730f',
  'Прямой':  '#8a929c',
}
export const channelColor = (c: string) => CHANNEL_COLOR[c] || '#8b5cf6'
