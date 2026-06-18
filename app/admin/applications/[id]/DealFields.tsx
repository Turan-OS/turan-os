'use client'

import { useState, useTransition } from 'react'
import type { Application } from '@/lib/supabase'

const fmtMoney = (n?: number) => n ? new Intl.NumberFormat('ru-RU').format(n) : ''

// ВАЖНО: компонент строки объявлен на уровне модуля. Если объявить его внутри
// DealFields, при каждом нажатии создаётся новый тип компонента → React
// размонтирует/монтирует инпут заново, поле теряет фокус и страница дёргается.
function FieldRow({ label, dark, children }: { label: string; dark?: boolean; children: React.ReactNode }) {
  const labelColor = dark ? '#8fa39a' : '#8a929c'
  const valueColor = dark ? '#e6efe9' : '#1f2329'
  const rowBorder = dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f2f4f7'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center', minHeight: 42, padding: '7px 0', borderBottom: rowBorder }}>
      <div style={{ fontSize: 12, color: labelColor }}>{label}</div>
      <div style={{ fontSize: 13.5, color: valueColor }}>{children}</div>
    </div>
  )
}

interface Props {
  app: Application
  team: string[]
  action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>
  dark?: boolean
}

function initFrom(app: Application) {
  return {
    name: app.name ?? '', responsible: app.responsible ?? '',
    amount: fmtMoney(app.amount), is_owner: app.is_owner ?? '', profit: app.profit ?? '',
    sphere: app.sphere ?? '', instagram: app.instagram ?? '', motivation: app.motivation ?? '',
    source: app.source ?? '', turnover: app.turnover ?? '',
  }
}

export default function DealFields({ app, team, action, dark }: Props) {
  const [f, setF] = useState(() => initFrom(app))
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const labelColor = dark ? '#8fa39a' : '#8a929c'
  const inp: React.CSSProperties = dark
    ? { width: '100%', padding: '7px 10px', fontSize: 13.5, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, color: '#e9f1ec', outline: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)' }
    : { width: '100%', padding: '7px 11px', fontSize: 13.5, border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff' }

  const upd = (k: keyof ReturnType<typeof initFrom>, v: string) => {
    setF(prev => ({ ...prev, [k]: v })); setDirty(true); setSaved(false); setError('')
  }

  const save = () => {
    setError('')
    const fd = new FormData()
    for (const [k, v] of Object.entries(f)) fd.append(k, v)
    startTransition(async () => {
      try {
        const res = await action(fd)
        if (res && res.ok === false) { setError(res.error || 'Не удалось сохранить'); return }
        setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения')
      }
    })
  }
  const saving = pending

  return (
    <div>
      <FieldRow dark={dark} label="Имя"><input value={f.name} onChange={e => upd('name', e.target.value)} placeholder="Без имени" style={inp} /></FieldRow>
      <FieldRow dark={dark} label="Отв-ный">
        <select value={f.responsible} onChange={e => upd('responsible', e.target.value)} style={inp}>
          <option value="">Не назначен</option>
          {team.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </FieldRow>
      <FieldRow dark={dark} label="Бюджет">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={f.amount} onChange={e => upd('amount', e.target.value)} placeholder="0" style={{ ...inp, maxWidth: 150 }} />
          <span style={{ color: labelColor, fontSize: 13 }}>so'm</span>
        </div>
      </FieldRow>
      <FieldRow dark={dark} label="Собственник">
        <select value={f.is_owner} onChange={e => upd('is_owner', e.target.value)} style={{ ...inp, maxWidth: 130 }}>
          <option value="">—</option><option value="Да">Да</option><option value="Нет">Нет</option>
        </select>
      </FieldRow>
      <FieldRow dark={dark} label="Доход 5K+">
        <select value={f.profit} onChange={e => upd('profit', e.target.value)} style={{ ...inp, maxWidth: 130 }}>
          <option value="">—</option><option value="Да">Да</option><option value="Нет">Нет</option>
        </select>
      </FieldRow>
      <FieldRow dark={dark} label="Сфера"><input value={f.sphere} onChange={e => upd('sphere', e.target.value)} placeholder="Сфера деятельности" style={inp} /></FieldRow>
      <FieldRow dark={dark} label="Оборот"><input value={f.turnover} onChange={e => upd('turnover', e.target.value)} placeholder="Оборот / прибыль" style={inp} /></FieldRow>
      <FieldRow dark={dark} label="Telegram / IG"><input value={f.instagram} onChange={e => upd('instagram', e.target.value)} placeholder="@аккаунт или сайт" style={inp} /></FieldRow>
      <FieldRow dark={dark} label="Источник"><input value={f.source} onChange={e => upd('source', e.target.value)} placeholder="Откуда лид" style={inp} /></FieldRow>
      <FieldRow dark={dark} label="Что хочет найти"><textarea value={f.motivation} onChange={e => upd('motivation', e.target.value)} placeholder="Мотивация" rows={2} style={{ ...inp, resize: 'vertical' }} /></FieldRow>

      {/* Липкая панель сохранения — всегда видна внизу сайдбара при прокрутке полей */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 2,
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        marginTop: 12, padding: '11px 0 6px',
        background: dark ? '#0f211a' : '#fff',
        borderTop: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eef0f3',
        boxShadow: dark ? '0 -10px 16px rgba(0,0,0,0.35)' : '0 -10px 16px rgba(16,24,40,0.05)',
      }}>
        <button type="button" onClick={save} disabled={saving || !dirty} className="admin-btn-primary"
          style={{ padding: '9px 22px', opacity: (saving || !dirty) ? 0.55 : 1, cursor: (saving || !dirty) ? 'default' : 'pointer' }}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {dirty && !saving && (
          <button type="button" onClick={() => { setF(initFrom(app)); setDirty(false); setError('') }}
            style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: dark ? '1px solid rgba(255,255,255,0.18)' : '1px solid #d7dce3', background: 'transparent', color: dark ? '#c3d0c9' : '#5b6470' }}>Отмена</button>
        )}
        <span style={{ fontSize: 12, fontWeight: dirty || saved ? 600 : 400, color: error ? '#ff6b5e' : dirty ? labelColor : saved ? '#1fc16b' : labelColor, marginLeft: 'auto' }}>
          {error || (dirty ? 'Есть изменения' : saved ? '✓ Сохранено' : '')}
        </span>
      </div>
    </div>
  )
}
