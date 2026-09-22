'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import ImageField from '@/app/admin/news/ImageField'
import DelayField from './DelayField'
import TgTextEditor from './TgTextEditor'
import SaveStepButton from './SaveStepButton'

export type Step = {
  id: number; broadcast_id: number; position: number | null; name: string | null
  delay_value: number | null; delay_unit: string | null; send_time: string | null
  text: string | null; image_url: string | null; video_url: string | null
  button_text: string | null; button_url: string | null
}
type Stats = { started: number; active: number; done: number; stopped: number }

type Props = {
  name: string
  active: boolean
  steps: Step[]
  stats: Stats
  sentByStep: Record<number, number>
  renameBroadcast: (fd: FormData) => Promise<void>
  toggleActive: () => Promise<void>
  addStep: () => Promise<void>
  saveStep: (fd: FormData) => Promise<void>
  delStep: (sid: number) => Promise<void>
  moveStep: (sid: number, dir: 'up' | 'down') => Promise<void>
}

const plural = (n: number, forms: [string, string, string]) => {
  const n10 = n % 10, n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}
function scheduleLabel(s: Step, idx: number): string {
  const v = Math.max(0, s.delay_value ?? 0)
  if (s.delay_unit === 'at' && s.send_time) {
    const day = v === 0 ? 'Сегодня' : v === 1 ? 'Завтра' : v === 2 ? 'Послезавтра' : `Через ${v} ${plural(v, ['день', 'дня', 'дней'])}`
    return `${day} · ${s.send_time}`
  }
  if (idx === 0 || s.delay_unit === 'immediate' || v === 0) return 'Сразу'
  if (s.delay_unit === 'minutes') return `Через ${v} ${plural(v, ['минуту', 'минуты', 'минут'])}`
  if (s.delay_unit === 'hours') return `Через ${v} ${plural(v, ['час', 'часа', 'часов'])}`
  return `Через ${v} ${plural(v, ['день', 'дня', 'дней'])}`
}

const TG = <svg width="15" height="15" viewBox="0 0 24 24" fill="#229ED9"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" /></svg>

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="admin-card" style={{ padding: '12px 18px', minWidth: 120, flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value.toLocaleString('ru-RU')}</div>
      <div style={{ fontSize: 12.5, color: '#8a929c', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function BroadcastBoard(p: Props) {
  const [selId, setSelId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [pending, start] = useTransition()

  const sel = p.steps.find(s => s.id === selId) ?? null
  const selIdx = sel ? p.steps.findIndex(s => s.id === sel.id) : -1

  const th: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'left', padding: '0 12px 10px' }
  const td: React.CSSProperties = { padding: '14px 12px', borderTop: '1px solid #eef0f3', verticalAlign: 'middle' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '14px 0 6px' }

  return (
    <div style={{ maxWidth: sel ? 1180 : 900 }}>
      <Link href="/admin/funnel/broadcasts" style={{ fontSize: 13, color: '#8a929c', textDecoration: 'none' }}>← Авторассылки</Link>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 18px', flexWrap: 'wrap' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: '#229ED9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12l19-8-3 18-6-4-3 4-2-6z" opacity=".9" /></svg>
        </span>
        {renaming ? (
          <form action={async (fd) => { await p.renameBroadcast(fd); setRenaming(false) }} style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
            <input name="name" defaultValue={p.name} autoFocus className="admin-input" style={{ fontSize: 17, fontWeight: 700, maxWidth: 360 }} />
            <button type="submit" className="admin-btn-primary" style={{ fontSize: 12, padding: '8px 14px' }}>ОК</button>
          </form>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{p.name}</h1>
            <span style={{ fontSize: 14, color: '#8a929c' }}>{p.steps.length} шагов</span>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setRenaming(v => !v)} className="admin-btn-ghost" style={{ fontSize: 12.5, padding: '9px 18px', letterSpacing: '0.03em' }}>НАСТРОЙКИ</button>
          <button type="button" disabled={pending} onClick={() => start(() => p.toggleActive())}
            style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: '0.03em', color: '#fff', background: p.active ? '#e0574a' : '#00c46f', opacity: pending ? 0.7 : 1 }}>
            {p.active ? 'ОСТАНОВИТЬ' : 'ЗАПУСТИТЬ'}
          </button>
        </div>
      </div>

      {/* Сводка */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <StatCard value={p.stats.started} label="Начали" color="#2a6fdb" />
        <StatCard value={p.stats.active} label="В процессе" color="#3a4250" />
        <StatCard value={p.stats.done} label="Закончили" color="#00955a" />
        <StatCard value={p.stats.stopped} label="Прервали" color="#e0954a" />
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Список шагов */}
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Наименование</th>
                {!sel && <th style={{ ...th, textAlign: 'center' }}>Отправлено</th>}
                {!sel && <th style={{ ...th, textAlign: 'center' }}>Просмотров</th>}
                {!sel && <th style={{ ...th, textAlign: 'center' }}>Кликов</th>}
                <th style={{ ...th, textAlign: 'center' }}>Статус</th>
                <th style={{ ...th, textAlign: 'center' }}>Каналы</th>
                <th style={{ ...th, width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {p.steps.map((s, idx) => {
                const isSel = s.id === selId
                return (
                  <tr key={s.id} onClick={() => { setSelId(s.id); setMenuId(null) }}
                    style={{ cursor: 'pointer', background: isSel ? '#f5f8ff' : 'transparent' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#e7f7ef', color: '#00a35c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{idx + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: '#1f2329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: sel ? 180 : 320 }}>{s.name || `Шаг ${idx + 1}`}</div>
                          <div style={{ fontSize: 12.5, color: '#2a6fdb', fontWeight: 600, marginTop: 2 }}>{scheduleLabel(s, idx)}</div>
                        </div>
                      </div>
                    </td>
                    {!sel && <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#2a6fdb' }}>{(p.sentByStep[s.id] ?? 0).toLocaleString('ru-RU')}</td>}
                    {!sel && <td style={{ ...td, textAlign: 'center', color: '#aab2bd' }} title="Telegram не отдаёт просмотры сообщений для ботов">—</td>}
                    {!sel && <td style={{ ...td, textAlign: 'center', color: '#aab2bd' }} title="Отслеживание кликов пока не настроено">—</td>}
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, color: p.active ? '#00955a' : '#8a929c', background: p.active ? 'rgba(0,196,111,0.12)' : '#f0f2f5', whiteSpace: 'nowrap' }}>{p.active ? '✓ Активен' : 'Остановлен'}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}><span style={{ display: 'inline-flex' }}>{TG}</span></td>
                    <td style={{ ...td, textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => setMenuId(menuId === s.id ? null : s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a929c', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}>⋮</button>
                      {menuId === s.id && (
                        <div style={{ position: 'absolute', right: 8, top: 34, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, boxShadow: '0 6px 20px rgba(16,24,40,0.12)', zIndex: 10, minWidth: 150, overflow: 'hidden' }}>
                          <button type="button" disabled={idx === 0} onClick={() => { start(() => p.moveStep(s.id, 'up')); setMenuId(null) }} style={menuItem(idx === 0)}>↑ Вверх</button>
                          <button type="button" disabled={idx === p.steps.length - 1} onClick={() => { start(() => p.moveStep(s.id, 'down')); setMenuId(null) }} style={menuItem(idx === p.steps.length - 1)}>↓ Вниз</button>
                          <button type="button" onClick={() => { if (confirm('Удалить шаг?')) { start(() => p.delStep(s.id)); if (selId === s.id) setSelId(null) } setMenuId(null) }} style={{ ...menuItem(false), color: '#d24a3d' }}>✕ Удалить</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <form action={p.addStep} style={{ marginTop: 16 }}>
            <button type="submit" className="admin-btn-primary" style={{ padding: '11px 24px' }}>+ Добавить шаг</button>
          </form>
        </div>

        {/* Боковая панель редактирования шага */}
        {sel && (
          <div className="admin-card" style={{ width: 440, flexShrink: 0, padding: '18px 20px', position: 'sticky', top: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{sel.name || `Шаг ${selIdx + 1}`}</span>
              <button type="button" onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a929c', fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>

            <form key={sel.id} action={p.saveStep}>
              <input type="hidden" name="step_id" value={sel.id} />

              <label style={lbl}>Название шага</label>
              <input name="name" defaultValue={sel.name ?? ''} placeholder={`Шаг ${selIdx + 1}`} className="admin-input" style={{ fontWeight: 600 }} />

              <div style={{ marginTop: 14 }}>
                <DelayField defaultValue={sel.delay_value ?? 1} defaultUnit={sel.delay_unit ?? 'days'} defaultSendTime={sel.send_time} isFirst={selIdx === 0} />
              </div>

              <label style={lbl}>Текст сообщения</label>
              <TgTextEditor name="text" defaultValue={sel.text ?? ''} />

              <div style={{ marginTop: 12 }}>
                <ImageField initialUrl={sel.image_url ?? undefined} folder="broadcast" />
              </div>

              <label style={lbl}>Видео (ссылка, необязательно)</label>
              <input name="video_url" defaultValue={sel.video_url ?? ''} className="admin-input" placeholder="https://… (mp4 / ссылка на видео)" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={lbl}>Кнопка — текст</label>
                  <input name="button_text" defaultValue={sel.button_text ?? ''} className="admin-input" placeholder="Напр.: Записаться" />
                </div>
                <div>
                  <label style={lbl}>Кнопка — ссылка</label>
                  <input name="button_url" defaultValue={sel.button_url ?? ''} className="admin-input" placeholder="https://…" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
                <SaveStepButton />
                <button type="button" onClick={() => setSelId(null)} className="admin-btn-ghost" style={{ padding: '10px 18px', fontSize: 13 }}>Отмена</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function menuItem(disabled: boolean): React.CSSProperties {
  return { display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', fontSize: 13, color: disabled ? '#c4ccd6' : '#3a4250', cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit' }
}
