import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import { hashPassword } from '@/lib/password'
import { getSetting, setSetting } from '@/lib/settings'
import { getBotUsername, findChatIdByCode, sendTelegramTo } from '@/lib/telegram'
import type { User } from '@/lib/supabase'
import PasswordForm from './PasswordForm'

const ROLES = [
  { key: 'manager', label: 'Менеджер' },
  { key: 'administrator', label: 'Администратор' },
  { key: 'recruiter', label: 'Рекрутер' },
  { key: 'admin', label: 'Админ' },
]
const ROLE_LABEL: Record<string, string> = { admin: 'Админ', administrator: 'Администратор', manager: 'Менеджер', recruiter: 'Рекрутер' }
const STATUS_LABEL: Record<string, string> = { pending: 'Ожидает', active: 'Активен', blocked: 'Заблокирован' }

// ── Server actions (управление пользователями — только админ) ──
async function createUser(formData: FormData) {
  'use server'
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const role = (formData.get('role') as string) || 'manager'
  if (!name || !email || password.length < 6) return
  const { data: exists } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()
  if (exists) return
  await supabaseAdmin.from('users').insert({ name, email, password_hash: hashPassword(password), role, status: 'active' })
  revalidatePath('/admin/settings')
}
async function setRole(formData: FormData) {
  'use server'
  await supabaseAdmin.from('users').update({ role: formData.get('role') as string }).eq('id', Number(formData.get('id')))
  revalidatePath('/admin/settings')
}
async function approve(formData: FormData) {
  'use server'
  await supabaseAdmin.from('users').update({ status: 'active', role: formData.get('role') as string }).eq('id', Number(formData.get('id')))
  revalidatePath('/admin/settings')
}
async function setStatus(id: number, status: string) {
  'use server'
  await supabaseAdmin.from('users').update({ status }).eq('id', id)
  revalidatePath('/admin/settings')
}
async function delUser(id: number) {
  'use server'
  await supabaseAdmin.from('users').delete().eq('id', id)
  revalidatePath('/admin/settings')
}
async function saveGoal(formData: FormData) {
  'use server'
  const v = Number((formData.get('goal') as string)?.replace(/\D/g, '')) || 30
  await setSetting('daily_call_goal', String(v))
  revalidatePath('/admin/settings'); revalidatePath('/admin')
}

async function toggleNewsDate(formData: FormData) {
  'use server'
  await setSetting('news_show_date', (formData.get('next') as string) || 'on')
  revalidatePath('/admin/settings'); revalidatePath('/news'); revalidatePath('/')
}

// ── Подключение Telegram сотрудника ──
async function genTgCode() {
  'use server'
  const me = await getCurrentUser(); if (!me) return
  // код вида u<id>-<рандом>: id пользователя гарантирует уникальность даже при одновременном подключении
  const code = `u${me.uid}-${Math.random().toString(36).slice(2, 8)}`
  await supabaseAdmin.from('users').update({ telegram_link_code: code }).eq('id', me.uid)
  revalidatePath('/admin/settings')
}
async function checkTgConnect() {
  'use server'
  const me = await getCurrentUser(); if (!me) return
  const { data: u } = await supabaseAdmin.from('users').select('telegram_link_code').eq('id', me.uid).maybeSingle()
  const code = u?.telegram_link_code
  if (!code) return
  const found = await findChatIdByCode(code)
  if (found) {
    await supabaseAdmin.from('users').update({ telegram_chat_id: found.id, telegram_link_code: null }).eq('id', me.uid)
    await sendTelegramTo(found.id, '✅ <b>Telegram подключён к TURAN OS</b>\n\nБуду присылать уведомления об обучении: когда открыт новый урок и когда домашка отправлена на доработку.')
  }
  revalidatePath('/admin/settings')
}
async function disconnectTg() {
  'use server'
  const me = await getCurrentUser(); if (!me) return
  await supabaseAdmin.from('users').update({ telegram_chat_id: null, telegram_link_code: null }).eq('id', me.uid)
  revalidatePath('/admin/settings')
}

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await getCurrentUser()
  const isAdmin = me?.role === 'admin'
  const sp = await searchParams
  const tab = sp.tab || (isAdmin ? 'users' : 'profile')

  const tabs = [
    { key: 'profile', label: 'Профиль' },
    ...(isAdmin ? [{ key: 'users', label: 'Пользователи' }, { key: 'plan', label: 'План' }, { key: 'site', label: 'Сайт' }] : []),
  ]
  const goal = isAdmin ? await getSetting('daily_call_goal', '30') : '30'
  const newsDateOn = isAdmin ? (await getSetting('news_show_date', 'on')) !== 'off' : true

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Настройки</h1>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e4e7ec', marginBottom: 28 }}>
        {tabs.map(t => (
          <Link key={t.key} href={`/admin/settings?tab=${t.key}`} style={{
            padding: '10px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            color: tab === t.key ? '#127a98' : '#8a929c',
            borderBottom: `2px solid ${tab === t.key ? '#1EAAD1' : 'transparent'}`, marginBottom: -1,
          }}>{t.label}</Link>
        ))}
      </div>

      {tab === 'profile' && (
        <div>
          <div className="admin-card" style={{ padding: '22px 26px', marginBottom: 20, maxWidth: 420 }}>
            <div style={{ fontSize: 13, color: '#8a929c' }}>Имя</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{me?.name}</div>
            <div style={{ fontSize: 13, color: '#8a929c' }}>Роль</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#127a98' }}>{ROLE_LABEL[me?.role ?? ''] ?? me?.role}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Уведомления в Telegram</div>
          <TelegramConnect uid={me?.uid} />

          <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '28px 0 14px' }}>Сменить пароль</div>
          <PasswordForm />
        </div>
      )}

      {tab === 'users' && isAdmin && <UsersTab me={me?.uid} />}

      {tab === 'plan' && isAdmin && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Дневной план</div>
          <form action={saveGoal} style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 420 }}>
            <label style={{ fontSize: 14, color: '#3a4250' }}>Дозвонов в день:</label>
            <input name="goal" type="number" min={1} defaultValue={goal} className="admin-input" style={{ maxWidth: 110 }} />
            <button type="submit" className="admin-btn-primary" style={{ padding: '10px 22px' }}>Сохранить</button>
          </form>
          <p style={{ fontSize: 12, color: '#8a929c', marginTop: 12, maxWidth: 480 }}>Это план по успешным дозвонам, который видит каждый менеджер на Рабочем столе. Прогресс считается за текущий день.</p>
        </div>
      )}

      {tab === 'site' && isAdmin && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Новости</div>
          <div className="admin-card" style={{ padding: '20px 24px', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Показывать даты новостей</div>
              <div style={{ fontSize: 13, color: '#8a929c', marginTop: 4 }}>
                {newsDateOn ? 'Сейчас даты видны у всех новостей на сайте.' : 'Сейчас даты скрыты у всех новостей.'}
              </div>
            </div>
            <form action={toggleNewsDate}>
              <input type="hidden" name="next" value={newsDateOn ? 'off' : 'on'} />
              <button type="submit" title="Переключить" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                <span style={{ width: 46, height: 26, borderRadius: 20, flexShrink: 0, background: newsDateOn ? '#1EAAD1' : '#cbd2da', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: newsDateOn ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </span>
              </button>
            </form>
          </div>
          <p style={{ fontSize: 12, color: '#8a929c', marginTop: 12, maxWidth: 520 }}>Глобально для всего сайта: включено — даты показываются у всех новостей, выключено — скрыты у всех.</p>
        </div>
      )}
    </div>
  )
}

async function TelegramConnect({ uid }: { uid?: number }) {
  if (!uid) return null
  const { data: u, error } = await supabaseAdmin.from('users').select('telegram_chat_id, telegram_link_code').eq('id', uid).maybeSingle()
  if (error) {
    return (
      <div className="admin-card" style={{ padding: '16px 22px', maxWidth: 560, fontSize: 13, color: '#b87613' }}>
        Чтобы включить уведомления, примените миграцию <code>scripts/migration-user-telegram.sql</code> в Supabase.
      </div>
    )
  }
  const connected = !!u?.telegram_chat_id
  const code = (u?.telegram_link_code as string | null) ?? null

  if (connected) {
    return (
      <div className="admin-card" style={{ padding: '18px 22px', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#127a98' }}>✅ Telegram подключён</div>
          <div style={{ fontSize: 13, color: '#8a929c', marginTop: 4 }}>Бот пришлёт, когда откроется новый урок или домашку вернут на доработку.</div>
        </div>
        <form action={disconnectTg}><button type="submit" className="admin-btn-ghost" style={{ fontSize: 12 }}>Отключить</button></form>
      </div>
    )
  }

  const bot = await getBotUsername()
  return (
    <div className="admin-card" style={{ padding: '18px 22px', maxWidth: 560 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Подключите Telegram</div>
      <div style={{ fontSize: 13, color: '#8a929c', marginBottom: 14 }}>Уведомления об обучении будут приходить прямо в Telegram.</div>
      {!code ? (
        <form action={genTgCode}><button type="submit" className="admin-btn-primary" style={{ padding: '10px 22px' }}>Подключить</button></form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#3a4250' }}><b>1.</b> Откройте бота и нажмите «Старт»:</div>
          {bot ? (
            <a href={`https://t.me/${bot}?start=${code}`} target="_blank" rel="noopener noreferrer" className="admin-btn-primary" style={{ display: 'inline-block', padding: '10px 22px', maxWidth: 260, textAlign: 'center' }}>Открыть @{bot}</a>
          ) : (
            <div style={{ fontSize: 13, color: '#b87613' }}>Бот недоступен (проверьте TELEGRAM_BOT_TOKEN). Код для ручного «/start»: <code>{code}</code></div>
          )}
          <div style={{ fontSize: 13, color: '#3a4250' }}><b>2.</b> Затем нажмите «Проверить»:</div>
          <form action={checkTgConnect}><button type="submit" className="admin-btn-ghost" style={{ padding: '9px 18px' }}>Проверить подключение</button></form>
          <div style={{ fontSize: 12, color: '#aab2bd' }}>Если не подключилось — убедитесь, что нажали «Старт» в боте, и нажмите «Проверить» ещё раз.</div>
        </div>
      )}
    </div>
  )
}

async function UsersTab({ me }: { me?: number }) {
  const { data } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false })
  const users = (data as User[]) ?? []
  const pending = users.filter(u => u.status === 'pending')
  const active = users.filter(u => u.status === 'active')
  const blocked = users.filter(u => u.status === 'blocked')
  const inp: React.CSSProperties = { padding: '9px 12px', fontSize: 13.5, border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff' }

  return (
    <div>
      {/* Добавить сотрудника */}
      <div className="form-panel" style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Добавить сотрудника</p>
        <form action={createUser} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input name="name" placeholder="Имя" required style={{ ...inp, flex: '1 1 150px' }} />
          <input name="email" type="email" placeholder="Email" required style={{ ...inp, flex: '1 1 180px' }} />
          <input name="password" type="text" placeholder="Пароль (от 6)" required minLength={6} style={{ ...inp, flex: '1 1 140px' }} />
          <select name="role" defaultValue="manager" style={{ ...inp, maxWidth: 170 }}>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <button type="submit" className="admin-btn-primary" style={{ padding: '10px 22px' }}>Создать</button>
        </form>
        <p style={{ fontSize: 12, color: '#8a929c', marginTop: 12 }}>Сотрудник входит сразу по этому email и паролю. Пароль он сможет сменить в своём профиле.</p>
      </div>

      {pending.length > 0 && (
        <Block title="Ожидают подтверждения" accent>
          {pending.map(u => (
            <Row key={u.id} u={u}>
              <form action={approve} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue="manager" style={{ ...inp, maxWidth: 160 }}>{ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
                <button type="submit" className="admin-btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>Одобрить</button>
                <Del id={u.id} />
              </form>
            </Row>
          ))}
        </Block>
      )}

      <Block title="Активные">
        {active.length === 0 && <div style={{ fontSize: 13, color: '#aab2bd' }}>Нет активных</div>}
        {active.map(u => (
          <Row key={u.id} u={u}>
            {me === u.id ? <span style={{ fontSize: 12, color: '#8a929c' }}>Это вы</span> : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <form action={setRole} style={{ display: 'flex', gap: 6 }}>
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} style={{ ...inp, maxWidth: 160 }}>{ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
                  <button type="submit" className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>Роль</button>
                </form>
                <form action={setStatus.bind(null, u.id, 'blocked')}><button type="submit" className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>Заблокировать</button></form>
                <Del id={u.id} />
              </div>
            )}
          </Row>
        ))}
      </Block>

      {blocked.length > 0 && (
        <Block title="Заблокированные">
          {blocked.map(u => (
            <Row key={u.id} u={u}>
              <div style={{ display: 'flex', gap: 8 }}>
                <form action={setStatus.bind(null, u.id, 'active')}><button type="submit" className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>Разблокировать</button></form>
                <Del id={u.id} />
              </div>
            </Row>
          ))}
        </Block>
      )}
    </div>
  )

  function Del({ id }: { id: number }) {
    return <form action={delUser.bind(null, id)}><button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button></form>
  }
  function Row({ u, children }: { u: User; children: React.ReactNode }) {
    return (
      <div className="admin-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1f2329' }}>{u.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: u.status === 'active' ? 'rgba(30,170,209,0.1)' : u.status === 'pending' ? 'rgba(240,160,32,0.12)' : '#f0f2f5', color: u.status === 'active' ? '#127a98' : u.status === 'pending' ? '#b87613' : '#8a929c' }}>{STATUS_LABEL[u.status]} · {ROLE_LABEL[u.role] ?? u.role}</span>
          </div>
          <div style={{ fontSize: 13, color: '#8a929c', marginTop: 3 }}>{u.email}</div>
        </div>
        <div>{children}</div>
      </div>
    )
  }
  function Block({ title, accent, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent ? '#127a98' : '#8a929c', marginBottom: 12 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
      </div>
    )
  }
}
