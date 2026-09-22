import { Fragment } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import { channelColor } from '@/lib/attribution'
import { WON_STAGE } from '@/lib/stages'
import LinkBuilder from './LinkBuilder'

type App = { channel: string | null; utm_source: string | null; utm_campaign: string | null; status: string | null; amount: number | null; created_at: string | null; source: string | null; tg_chat_id: number | null }

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n)
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0

const PERIODS: Record<string, { label: string; days: number | null }> = {
  '7':   { label: '7 дней', days: 7 },
  '30':  { label: '30 дней', days: 30 },
  '90':  { label: '90 дней', days: 90 },
  'all': { label: 'Всё время', days: null },
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin')

  const sp = await searchParams
  const period = PERIODS[sp.period ?? '30'] ? (sp.period ?? '30') : '30'
  const days = PERIODS[period].days
  const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null

  // заявки за период (с пагинацией — обходим лимит 1000 строк)
  const apps: App[] = []
  for (let from = 0; ; from += 1000) {
    let q = supabaseAdmin.from('applications')
      .select('channel, utm_source, utm_campaign, status, amount, created_at, source, tg_chat_id')
      .order('created_at', { ascending: false }).range(from, from + 999)
    if (since) q = q.gte('created_at', since)
    const { data } = await q
    const chunk = (data as App[]) ?? []
    apps.push(...chunk)
    if (chunk.length < 1000) break
  }

  // подписчики бота и клики лендингов (для верхней воронки)
  const { count: subCount } = await supabaseAdmin.from('bot_users').select('*', { count: 'exact', head: true })
  const { data: landings } = await supabaseAdmin.from('landings').select('name, slug, title, clicks')
  const totalClicks = (landings ?? []).reduce((s, l) => s + (l.clicks ?? 0), 0)
  const landingList = (landings ?? []).map(l => ({ slug: l.slug as string, name: (l.name || l.title || l.slug) as string }))

  // разбивка по каналам
  type Agg = { count: number; won: number; revenue: number }
  const byChannel = new Map<string, Agg>()
  const byCampaign = new Map<string, Agg>()
  let taggedCount = 0
  for (const a of apps) {
    const ch = a.channel || (a.source?.startsWith('Сайт') ? 'Прямой' : 'Не размечено')
    if (a.channel) taggedCount++
    const won = a.status === WON_STAGE ? 1 : 0
    const rev = won ? (a.amount ?? 0) : 0
    const c = byChannel.get(ch) ?? { count: 0, won: 0, revenue: 0 }
    c.count++; c.won += won; c.revenue += rev; byChannel.set(ch, c)
    if (a.utm_campaign) {
      const k = a.utm_campaign
      const cc = byCampaign.get(k) ?? { count: 0, won: 0, revenue: 0 }
      cc.count++; cc.won += won; cc.revenue += rev; byCampaign.set(k, cc)
    }
  }
  const channels = [...byChannel.entries()].sort((a, b) => b[1].count - a[1].count)
  const campaigns = [...byCampaign.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 12)
  const totalApps = apps.length
  const funnelApps = apps.filter(a => a.tg_chat_id != null).length
  const totalWon = apps.filter(a => a.status === WON_STAGE).length
  const totalRevenue = apps.filter(a => a.status === WON_STAGE).reduce((s, a) => s + (a.amount ?? 0), 0)
  const maxChan = Math.max(1, ...channels.map(c => c[1].count))

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e9edf1', borderRadius: 12, padding: '16px 18px' }
  const lbl: React.CSSProperties = { fontSize: 11, color: '#8a929c', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Аналитика</h1>
        <span style={{ fontSize: 14, color: '#8a929c' }}>сквозная — от источника до заявки</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {Object.entries(PERIODS).map(([k, v]) => (
            <Link key={k} href={`/admin/analytics?period=${k}`} style={{
              fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
              border: `1px solid ${period === k ? '#00c46f' : '#e4e7ec'}`,
              background: period === k ? '#e7f7ef' : '#fff', color: period === k ? '#00955a' : '#5b6470',
            }}>{v.label}</Link>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#8a929c', marginBottom: 20 }}>Кто откуда пришёл и оставил заявку. Размечайте ссылки метками (генератор ниже) — тогда каждый канал будет виден отдельно.</p>

      {/* Верхняя воронка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={card}><div style={lbl}>Клики лендингов</div><div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(totalClicks)}</div></div>
        <div style={card}><div style={lbl}>Подписчики бота</div><div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(subCount ?? 0)}</div></div>
        <div style={card}><div style={lbl}>Заявки за период</div><div style={{ fontSize: 24, fontWeight: 700, color: '#00a35c' }}>{fmt(totalApps)}</div></div>
        <div style={card}><div style={lbl}>Из них из воронки</div><div style={{ fontSize: 24, fontWeight: 700, color: '#b8730f' }}>{fmt(funnelApps)}</div></div>
        <div style={card}><div style={lbl}>Резиденты · выручка</div><div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(totalWon)} <span style={{ fontSize: 13, color: '#8a929c', fontWeight: 500 }}>· {fmt(totalRevenue)} сум</span></div></div>
      </div>

      {/* Заявки по каналам */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Заявки по каналам</div>
        {channels.length === 0 && <p style={{ fontSize: 13, color: '#aab2bd' }}>За период заявок нет.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {channels.map(([ch, a]) => (
            <div key={ch}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: channelColor(ch), display: 'inline-block' }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1f2329' }}>{ch}</span>
                <span style={{ fontSize: 12.5, color: '#8a929c' }}>{a.count} заявок · {a.won} резид.{a.revenue > 0 ? ` · ${fmt(a.revenue)} сум` : ''}</span>
                <span style={{ fontSize: 12, color: '#aab2bd', marginLeft: 'auto' }}>{pct(a.count, totalApps)}%</span>
              </div>
              <div style={{ height: 8, background: '#f0f2f5', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pct(a.count, maxChan)}%`, height: '100%', background: channelColor(ch), borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
        {taggedCount === 0 && totalApps > 0 && (
          <p style={{ fontSize: 12.5, color: '#b87613', marginTop: 14, background: '#fbf1dd', borderRadius: 8, padding: '8px 12px' }}>
            Пока заявки без меток — все попадают в «Прямой/Не размечено». Как начнёте вести рекламу по размеченным ссылкам (генератор ниже), каналы разделятся.
          </p>
        )}
      </div>

      {/* По кампаниям */}
      {campaigns.length > 0 && (
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>По кампаниям (utm_campaign)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px 16px', fontSize: 13 }}>
            <div style={{ ...lbl, marginBottom: 0 }}>Кампания</div><div style={{ ...lbl, marginBottom: 0 }}>Заявок</div><div style={{ ...lbl, marginBottom: 0 }}>Резид.</div><div style={{ ...lbl, marginBottom: 0 }}>Выручка</div>
            {campaigns.map(([k, a]) => (
              <Fragment key={k}>
                <div style={{ color: '#1f2329', fontWeight: 500 }}>{k}</div>
                <div>{a.count}</div><div>{a.won}</div><div>{a.revenue > 0 ? fmt(a.revenue) : '—'}</div>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Генератор ссылок */}
      <LinkBuilder landings={landingList} />
    </div>
  )
}
