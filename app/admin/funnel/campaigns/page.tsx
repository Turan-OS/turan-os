import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'
import ImageField from '@/app/admin/news/ImageField'
import TgTextEditor from '../broadcasts/[id]/TgTextEditor'
import CampaignSendControls from './CampaignSendControls'

type Campaign = {
  id: number; text: string | null; image_url: string | null
  button_text: string | null; button_url: string | null
  status: string; total: number; sent: number; failed: number
  author_name: string | null; created_at: string | null; finished_at: string | null
  bot_id: number | null
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' }

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  queued:   { label: 'В очереди',   color: '#b87613', bg: '#fbf1dd' },
  sending:  { label: 'Отправляется', color: '#3a7bd5', bg: '#eaf1fb' },
  done:     { label: 'Отправлено',  color: '#00955a', bg: '#e7f7ef' },
  canceled: { label: 'Отменена',    color: '#8a929c', bg: '#f0f2f5' },
}

const fmt = (s?: string | null) => s ? new Date(s).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

export default async function CampaignsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  const { count } = await supabaseAdmin.from('bot_users').select('*', { count: 'exact', head: true })
  const subCount = count ?? 0

  // боты с токеном (только через них можно слать) + аудитория каждого
  const { data: botsData } = await supabaseAdmin.from('tg_bots').select('id, username, title, token, active').order('id')
  const allBots = (botsData as { id: number; username: string | null; title: string | null; token: string | null; active: boolean | null }[]) ?? []
  const botName = new Map(allBots.map(b => [b.id, b.username || b.title || `#${b.id}`]))
  const sendBots: { id: number; username: string; count: number }[] = []
  for (const b of allBots) {
    if (!b.token || b.active === false) continue
    const { count: c } = await supabaseAdmin.from('bot_users').select('*', { count: 'exact', head: true }).eq('bot_id', b.id)
    sendBots.push({ id: b.id, username: b.username || b.title || `#${b.id}`, count: c ?? 0 })
  }

  const { data } = await supabaseAdmin.from('bot_campaigns').select('*').order('created_at', { ascending: false }).limit(50)
  const campaigns = (data as Campaign[]) ?? []

  // ── создать кампанию (в очередь воркеру) ──
  async function createCampaign(formData: FormData) {
    'use server'
    const u = await getCurrentUser()
    if (!u || u.role === 'manager') return
    const g = (k: string) => ((formData.get(k) as string) ?? '').trim() || null
    const text = g('text'), image = g('image_url')
    if (!text && !image) return // пустую рассылку не создаём
    const botId = formData.get('bot_id') ? Number(formData.get('bot_id')) : null
    if (!botId) return // без бота-отправителя не создаём
    const { count: c } = await supabaseAdmin.from('bot_users').select('*', { count: 'exact', head: true }).eq('bot_id', botId)
    await supabaseAdmin.from('bot_campaigns').insert({
      text, image_url: image, button_text: g('button_text'), button_url: g('button_url'),
      status: 'queued', total: c ?? 0, author_name: u.name, bot_id: botId,
    })
    revalidatePath('/admin/funnel/campaigns')
  }

  async function cancelCampaign(id: number) {
    'use server'
    const u = await getCurrentUser()
    if (!u || u.role === 'manager') return
    await supabaseAdmin.from('bot_campaigns').update({ status: 'canceled' }).eq('id', id).eq('status', 'queued')
    revalidatePath('/admin/funnel/campaigns')
  }

  const inp = 'admin-input'

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Рассылки</h1>
        <span style={{ fontSize: 14, color: '#8a929c' }}>{subCount} подписчиков</span>
      </div>
      <p style={{ fontSize: 13, color: '#8a929c', marginBottom: 22 }}>Разовое сообщение всем, кто подписан на Telegram-бота воронки. Отправку выполняет воркер с учётом лимитов Telegram — большая база рассылается постепенно.</p>

      {/* Составление */}
      <form action={createCampaign} className="admin-card" style={{ padding: '18px 20px', marginBottom: 28 }}>
        <label style={lbl}>Текст сообщения</label>
        <TgTextEditor name="text" defaultValue="" />

        <div style={{ marginTop: 12 }}>
          <ImageField initialUrl={undefined} folder="campaign" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={lbl}>Кнопка — текст</label>
            <input name="button_text" className={inp} placeholder="Напр.: Записаться" />
          </div>
          <div>
            <label style={lbl}>Кнопка — ссылка</label>
            <input name="button_url" className={inp} placeholder="https://…" />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <CampaignSendControls bots={sendBots} />
        </div>
      </form>

      {/* История */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>История рассылок</div>
      {campaigns.length === 0 && <p style={{ fontSize: 13, color: '#aab2bd' }}>Пока не было рассылок.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {campaigns.map(c => {
          const st = STATUS[c.status] ?? STATUS.queued
          return (
            <div key={c.id} className="admin-card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 5, color: st.color, background: st.bg }}>{st.label}</span>
                <span style={{ fontSize: 12.5, color: '#5b6470' }}>
                  {c.status === 'done' || c.status === 'sending'
                    ? <>отправлено {c.sent} из {c.total}{c.failed > 0 ? ` · ошибок ${c.failed}` : ''}</>
                    : <>получателей: {c.total}</>}
                </span>
                {c.bot_id && <span style={{ fontSize: 12, color: '#5b6470' }}>@{botName.get(c.bot_id)}</span>}
                <span style={{ fontSize: 12, color: '#aab2bd', marginLeft: 'auto' }}>{fmt(c.created_at)}{c.author_name ? ` · ${c.author_name}` : ''}</span>
                {c.status === 'queued' && (
                  <form action={cancelCampaign.bind(null, c.id)}>
                    <button type="submit" className="admin-btn-ghost" style={{ fontSize: 11, padding: '4px 9px' }}>Отменить</button>
                  </form>
                )}
              </div>
              {c.text && <div style={{ fontSize: 13.5, color: '#2b3138', lineHeight: 1.5, whiteSpace: 'pre-line', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{c.text.replace(/<[^>]+>/g, '')}</div>}
              {c.image_url && <div style={{ fontSize: 12, color: '#8a929c', marginTop: 4 }}>🖼 с изображением</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
