'use client'

import { useState } from 'react'

type Landing = { slug: string; name: string }
type Preset = { key: string; label: string; source: string; medium: string; hint: string }

// пресеты соответствуют классификации каналов в lib/attribution.ts
const PRESETS: Preset[] = [
  { key: 'target_ig', label: 'Таргет Instagram', source: 'instagram', medium: 'cpc', hint: 'платная реклама в Instagram → канал «Таргет»' },
  { key: 'target_fb', label: 'Таргет Facebook',  source: 'facebook',  medium: 'cpc', hint: 'платная реклама в Facebook → канал «Таргет»' },
  { key: 'ig_bio',    label: 'Instagram (профиль/сторис)', source: 'instagram', medium: 'social', hint: 'ссылка в bio/сторис → канал «Соцсети»' },
  { key: 'tg',        label: 'Telegram',          source: 'telegram', medium: 'social', hint: 'посты/канал в Telegram → «Соцсети»' },
  { key: 'youtube',   label: 'YouTube',           source: 'youtube',  medium: 'social', hint: 'описание/видео на YouTube → «Соцсети»' },
]

export default function LinkBuilder({ landings }: { landings: Landing[] }) {
  const [preset, setPreset] = useState<Preset>(PRESETS[0])
  const [campaign, setCampaign] = useState('')
  const [dest, setDest] = useState<string>(landings[0] ? `/lp/${landings[0].slug}` : '/')
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams()
  params.set('utm_source', preset.source)
  params.set('utm_medium', preset.medium)
  if (campaign.trim()) params.set('utm_campaign', campaign.trim().replace(/\s+/g, '_').toLowerCase())
  const link = `${origin}${dest}?${params.toString()}`

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e9edf1', borderRadius: 12, padding: '16px 18px' }
  const lbl: React.CSSProperties = { fontSize: 11, color: '#8a929c', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }

  return (
    <div style={card}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Генератор ссылок с метками</div>
      <p style={{ fontSize: 12.5, color: '#8a929c', marginBottom: 14 }}>Выберите канал и куда ведёте — вставьте готовую ссылку в рекламу, bio или пост. Метки долетят до заявки.</p>

      {/* Канал */}
      <div style={{ ...lbl }}>Канал</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {PRESETS.map(p => (
          <button key={p.key} type="button" onClick={() => setPreset(p)} style={{
            fontSize: 12.5, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            border: `1px solid ${preset.key === p.key ? '#00c46f' : '#e4e7ec'}`,
            background: preset.key === p.key ? '#e7f7ef' : '#fff', color: preset.key === p.key ? '#00955a' : '#5b6470',
          }}>{p.label}</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#aab2bd', marginTop: -8, marginBottom: 14 }}>{preset.hint}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={lbl}>Куда ведём</div>
          <select value={dest} onChange={e => setDest(e.target.value)} className="admin-input" style={{ width: '100%' }}>
            {landings.map(l => <option key={l.slug} value={`/lp/${l.slug}`}>Лендинг: {l.name}</option>)}
            <option value="/">Главная сайта</option>
          </select>
        </div>
        <div>
          <div style={lbl}>Кампания (необязательно)</div>
          <input value={campaign} onChange={e => setCampaign(e.target.value)} className="admin-input" placeholder="напр. sept_sale" style={{ width: '100%' }} />
        </div>
      </div>

      <div style={lbl}>Готовая ссылка</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input readOnly value={link} onFocus={e => e.currentTarget.select()} style={{
          flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #d7dce3',
          background: '#f7f8fa', color: '#1f2329', fontFamily: 'ui-monospace, monospace', outline: 'none',
        }} />
        <button type="button" onClick={copy} className="admin-btn-primary" style={{ padding: '0 18px', whiteSpace: 'nowrap' }}>
          {copied ? '✓ Скопировано' : 'Копировать'}
        </button>
      </div>
    </div>
  )
}
