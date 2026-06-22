import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { getSetting } from '@/lib/settings'
import { STAGES, FUNNEL_STAGES, FIRST_STAGE, WON_STAGE, TITLE_TO_KEY } from '@/lib/stages'

// начало «сегодня» по Ташкенту (UTC+5)
function todayStartUTC() {
  const tk = new Date(Date.now() + 5 * 3600 * 1000)
  return new Date(Date.UTC(tk.getUTCFullYear(), tk.getUTCMonth(), tk.getUTCDate()) - 5 * 3600 * 1000)
}
function startNDaysAgoISO(n: number) {
  const d = todayStartUTC()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

const PERIODS: Record<string, { label: string; days: number }> = {
  today: { label: 'сегодня', days: 1 },
  week:  { label: 'за 7 дней', days: 7 },
  month: { label: 'за 30 дней', days: 30 },
}

interface Metrics { calls: number; stages: number; leads: number; notes: number; tasks: number }
const empty = (): Metrics => ({ calls: 0, stages: 0, leads: 0, notes: 0, tasks: 0 })

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const me = await getCurrentUser()
  const isManager = me?.role === 'manager'
  const goal = Number(await getSetting('daily_call_goal', '30')) || 30

  const sp = await searchParams
  const period = sp.period && PERIODS[sp.period] ? sp.period : 'today'
  const { label: periodLabel, days } = PERIODS[period]
  const since = startNDaysAgoISO(days - 1)
  const planTotal = goal * days

  // активные пользователи (для разбивки у админа)
  const { data: usersData } = await supabaseAdmin.from('users').select('id, name').eq('status', 'active').order('name')
  const users = (usersData as { id: number; name: string }[]) ?? []
  const nameById = new Map(users.map(u => [u.id, u.name]))

  // сегодняшние действия
  const [{ data: acts }, { data: cms }, { data: tks }] = await Promise.all([
    supabaseAdmin.from('application_activity').select('type, user_id, text').gte('created_at', since),
    supabaseAdmin.from('application_comments').select('user_id').gte('created_at', since),
    supabaseAdmin.from('application_tasks').select('user_id').gte('created_at', since),
  ])

  // агрегируем по user_id
  const byUser = new Map<number, Metrics>()
  const bump = (uid: number | null | undefined, key: keyof Metrics) => {
    if (uid == null) return
    if (!byUser.has(uid)) byUser.set(uid, empty())
    byUser.get(uid)![key]++
  }
  for (const a of acts ?? []) {
    if (a.type === 'call') bump(a.user_id, 'calls')
    else if (a.type === 'stage') bump(a.user_id, 'stages')
    else if (a.type === 'lead') bump(a.user_id, 'leads')
  }
  for (const c of cms ?? []) bump(c.user_id, 'notes')
  for (const t of tks ?? []) bump(t.user_id, 'tasks')

  const mine = (me?.uid != null ? byUser.get(me.uid) : null) ?? empty()

  // ── Воронка: сколько лидов зашло в каждый этап за период ──
  const FLOW = FUNNEL_STAGES
  const entered: Record<string, number> = Object.fromEntries(STAGES.map(s => [s.key, 0]))

  // первый этап = созданные за период заявки
  let newQ = supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', since)
  if (isManager && me) newQ = newQ.eq('responsible', me.name)
  const { count: newCount } = await newQ
  entered[FIRST_STAGE] = newCount ?? 0

  // остальные этапы = переходы в них (из ленты активности)
  for (const a of acts ?? []) {
    if (a.type !== 'stage') continue
    if (isManager && a.user_id !== me?.uid) continue
    const target = ((a.text as string) || '').split('→').pop()?.trim()
    const key = target ? TITLE_TO_KEY[target] : null
    if (key && key !== FIRST_STAGE) entered[key]++
  }

  const base = entered[FIRST_STAGE]
  const funnelMax = Math.max(base, 1)
  const pct = (n: number) => Math.round((n / funnelMax) * 100)
  const conv = (n: number) => base ? Math.round((n / base) * 100) : 0

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Рабочий стол</h1>
          <p style={{ fontSize: 13, color: '#8a929c' }}>{me?.name}</p>
        </div>
        {/* Период */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 10, padding: 3 }}>
          {Object.entries(PERIODS).map(([key, p]) => (
            <Link key={key} href={`/admin?period=${key}`} style={{
              padding: '7px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8, textDecoration: 'none',
              background: period === key ? '#eaf7f0' : 'transparent',
              color: period === key ? '#127a98' : '#8a929c',
            }}>{key === 'today' ? 'Сегодня' : key === 'week' ? 'Неделя' : 'Месяц'}</Link>
          ))}
        </div>
      </div>

      {/* Воронка по этапам */}
      <div className="admin-card" style={{ padding: '24px 28px', marginTop: 18, marginBottom: 18, maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3a4250' }}>Воронка {periodLabel}</span>
          <span style={{ fontSize: 13, color: '#8a929c' }}>конверсия в клиента <b style={{ color: entered[WON_STAGE] ? '#127a98' : '#8a929c' }}>{conv(entered[WON_STAGE])}%</b></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FLOW.map((s, i) => {
            const n = entered[s.key]
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 150, fontSize: 12.5, color: '#3a4250', fontWeight: 600, flexShrink: 0 }}>{s.title}</div>
                <div style={{ flex: 1, height: 30, background: '#f1f3f6', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.max(n ? 6 : 0, pct(n))}%`, height: '100%', background: s.color, borderRadius: 7, transition: 'width .3s' }} />
                </div>
                <div style={{ width: 96, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#1f2329' }}>{n}</span>
                  {i > 0 && <span style={{ fontSize: 12, color: '#aab2bd', marginLeft: 6 }}>{conv(n)}%</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f2f4f7', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#e0574a' }} />
          <span style={{ fontSize: 13, color: '#8a929c' }}>Отказ {periodLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1f2329', marginLeft: 'auto' }}>{entered.rejected}</span>
        </div>
      </div>

      {/* План по дозвонам */}
      <div className="admin-card" style={{ padding: '24px 28px', marginTop: 18, marginBottom: 18, maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3a4250' }}>📞 Дозвоны {periodLabel}</span>
          <span style={{ fontSize: 14, color: '#8a929c' }}>план {planTotal}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: mine.calls >= planTotal ? '#127a98' : '#1f2329', lineHeight: 1 }}>{mine.calls}</span>
          <span style={{ fontSize: 15, color: '#8a929c' }}>/ {planTotal}</span>
          {mine.calls >= planTotal
            ? <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#127a98' }}>✓ План выполнен</span>
            : <span style={{ marginLeft: 'auto', fontSize: 13, color: '#b87613', fontWeight: 600 }}>осталось {planTotal - mine.calls}</span>}
        </div>
        <div style={{ height: 10, borderRadius: 6, background: '#eef0f3', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, Math.round((mine.calls / planTotal) * 100))}%`, height: '100%', borderRadius: 6, background: mine.calls >= planTotal ? '#1EAAD1' : 'linear-gradient(90deg,#1EAAD1,#1EAAD1)', transition: 'width .3s' }} />
        </div>
      </div>

      {/* Мои действия сегодня */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, maxWidth: 760, marginBottom: 36 }}>
        <Stat label="Примечания" value={mine.notes} />
        <Stat label="Смены этапа" value={mine.stages} />
        <Stat label="Взято в работу" value={mine.leads} />
        <Stat label="Задачи" value={mine.tasks} />
      </div>

      {/* Разбивка по сотрудникам (админ / администратор) */}
      {!isManager && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929c', marginBottom: 12 }}>По сотрудникам · {periodLabel}</div>
          <div className="admin-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f7f8fa', textAlign: 'left' }}>
                  {['Сотрудник', 'Дозвоны', 'Примечания', 'Этапы', 'В работу', 'Задачи'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontWeight: 600, color: '#8a929c', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const m = byUser.get(u.id) ?? empty()
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f2f4f7' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1f2329' }}>{u.name}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontWeight: 700, color: m.calls >= planTotal ? '#127a98' : '#1f2329' }}>{m.calls}</span>
                        <span style={{ color: '#aab2bd' }}> / {planTotal}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#3a4250' }}>{m.notes}</td>
                      <td style={{ padding: '11px 16px', color: '#3a4250' }}>{m.stages}</td>
                      <td style={{ padding: '11px 16px', color: '#3a4250' }}>{m.leads}</td>
                      <td style={{ padding: '11px 16px', color: '#3a4250' }}>{m.tasks}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: '#aab2bd', marginTop: 10 }}>Изменить дневной план можно в <Link href="/admin/settings?tab=plan" style={{ color: '#127a98', textDecoration: 'none' }}>Настройках</Link>.</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2329', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#8a929c' }}>{label}</div>
    </div>
  )
}
