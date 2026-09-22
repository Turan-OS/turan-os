import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/currentUser'

type Bot = { id: number; username: string | null; token: string | null; title: string | null; active: boolean | null }

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' }

export default async function BotsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin')

  const { data, error } = await supabaseAdmin.from('tg_bots').select('*').order('id')
  const bots = (data as Bot[]) ?? []

  // число подписчиков по каждому боту
  const counts: Record<number, number> = {}
  for (const b of bots) {
    const { count } = await supabaseAdmin.from('bot_users').select('*', { count: 'exact', head: true }).eq('bot_id', b.id)
    counts[b.id] = count ?? 0
  }

  async function addBot(formData: FormData) {
    'use server'
    const u = await getCurrentUser(); if (!u || u.role === 'manager') return
    const username = ((formData.get('username') as string) ?? '').trim().replace(/^@/, '')
    const token = ((formData.get('token') as string) ?? '').trim() || null
    const title = ((formData.get('title') as string) ?? '').trim() || null
    if (!username) return
    await supabaseAdmin.from('tg_bots').upsert({ username, token, title, active: true }, { onConflict: 'username' })
    revalidatePath('/admin/funnel/bots')
  }
  async function saveBot(formData: FormData) {
    'use server'
    const u = await getCurrentUser(); if (!u || u.role === 'manager') return
    const id = Number(formData.get('id'))
    await supabaseAdmin.from('tg_bots').update({
      token: ((formData.get('token') as string) ?? '').trim() || null,
      title: ((formData.get('title') as string) ?? '').trim() || null,
    }).eq('id', id)
    revalidatePath('/admin/funnel/bots')
  }
  async function toggleBot(id: number) {
    'use server'
    const u = await getCurrentUser(); if (!u || u.role === 'manager') return
    const { data: b } = await supabaseAdmin.from('tg_bots').select('active').eq('id', id).maybeSingle()
    await supabaseAdmin.from('tg_bots').update({ active: !(b?.active !== false) }).eq('id', id)
    revalidatePath('/admin/funnel/bots')
  }
  async function delBot(id: number) {
    'use server'
    const u = await getCurrentUser(); if (!u || u.role === 'manager') return
    await supabaseAdmin.from('bot_users').update({ bot_id: null }).eq('bot_id', id)
    await supabaseAdmin.from('tg_bots').delete().eq('id', id)
    revalidatePath('/admin/funnel/bots')
  }

  const inp = 'admin-input'

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Боты</h1>
      <p style={{ fontSize: 13, color: '#8a929c', marginBottom: 22 }}>Telegram-боты для воронок и рассылок. Токен берётся в @BotFather. Каждый подписчик привязан к своему боту, и сообщения уходят через нужный токен.</p>

      {error && (
        <div className="admin-card" style={{ padding: '18px 22px', color: '#b87613', fontSize: 13.5, marginBottom: 16 }}>
          Таблица ботов ещё не создана. Примени миграцию <code>scripts/migration-multibot.sql</code> в Supabase → SQL Editor.
        </div>
      )}

      {/* список ботов */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {bots.map(b => (
          <form key={b.id} action={saveBot} className="admin-card" style={{ padding: '16px 18px' }}>
            <input type="hidden" name="id" value={b.id} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#229ED9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" /></svg>
              </span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>@{b.username}</span>
              <span style={{ fontSize: 12.5, color: '#8a929c' }}>· {counts[b.id] ?? 0} подписчиков</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 5, color: b.token ? '#00955a' : '#d24a3d', background: b.token ? '#e7f7ef' : '#fdecea' }}>{b.token ? 'токен задан' : 'нет токена'}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button type="submit" formAction={toggleBot.bind(null, b.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '6px 11px' }}>{b.active !== false ? 'Выключить' : 'Включить'}</button>
                <button type="submit" formAction={delBot.bind(null, b.id)} className="admin-btn-danger" style={{ fontSize: 12, padding: '6px 10px' }}>✕</button>
              </span>
            </div>
            <label style={lbl}>Токен бота (из @BotFather)</label>
            <input name="token" defaultValue={b.token ?? ''} className={inp} placeholder="123456789:AA..." style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 10, alignItems: 'end' }}>
              <div>
                <label style={lbl}>Название (для себя)</label>
                <input name="title" defaultValue={b.title ?? ''} className={inp} placeholder="Напр.: Бот воронки" />
              </div>
              <button type="submit" className="admin-btn-primary" style={{ padding: '10px 20px' }}>Сохранить</button>
            </div>
          </form>
        ))}
      </div>

      {/* добавить бота */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Добавить бота</div>
      <form action={addBot} className="admin-card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Username (без @)</label>
            <input name="username" className={inp} placeholder="my_funnel_bot" required />
          </div>
          <div>
            <label style={lbl}>Название</label>
            <input name="title" className={inp} placeholder="Напр.: Второй бот" />
          </div>
        </div>
        <label style={{ ...lbl, marginTop: 10 }}>Токен (из @BotFather)</label>
        <input name="token" className={inp} placeholder="123456789:AA..." style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} />
        <button type="submit" className="admin-btn-primary" style={{ padding: '11px 24px', marginTop: 14 }}>+ Добавить бота</button>
      </form>
    </div>
  )
}
