'use client'

import { useState } from 'react'

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  const local = d.startsWith('998') ? d.slice(3) : d
  const n = local.slice(0, 9)
  let out = '+998'
  if (n.length > 0) out += ' ' + n.slice(0, 2)
  if (n.length > 2) out += ' ' + n.slice(2, 5)
  if (n.length > 5) out += ' ' + n.slice(5, 7)
  if (n.length > 7) out += ' ' + n.slice(7, 9)
  return out
}

type Fbq = ((...args: unknown[]) => void) | undefined

export default function LeadForm({ slug, buttonText, pixel, contentName, contentCategory }: {
  slug: string; buttonText: string; pixel?: boolean; contentName?: string; contentCategory?: string
}) {
  const [phone, setPhone] = useState('+998')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    if (pixel) {
      const fbq = (window as unknown as { fbq?: Fbq }).fbq
      try { fbq?.('track', 'Lead', { content_name: contentName, content_category: contentCategory }) } catch {}
    }
    // метки рекламы из URL — уедут в funnel_tokens, чтобы источник дошёл до заявки
    const utm: Record<string, string> = {}
    try {
      const p = new URLSearchParams(window.location.search)
      ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => { const v = p.get(k); if (v) utm[k] = v.slice(0, 200) })
    } catch {}
    let data: { token?: string; url?: string } = {}
    try {
      const res = await fetch(`/api/lp/${slug}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...utm }),
      })
      data = await res.json().catch(() => ({}))
    } catch {}
    // переходим сразу по готовой ссылке из ответа; запасной путь — через /go
    window.location.href = data.url || `/lp/${slug}/go${data.token ? `?t=${data.token}` : ''}`
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 15px', fontSize: 16, borderRadius: 12,
    border: '1px solid #d7dce3', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    color: '#16241d', background: '#fff',
  }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6a756e', marginBottom: 5, display: 'block' }

  return (
    <form onSubmit={submit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`.lp-inp::placeholder{color:#aab2bd;opacity:1}`}</style>
      <div>
        <label style={lbl}>Телефон</label>
        <input className="lp-inp" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} required inputMode="tel" placeholder="+998 90 123 45 67" style={inp} />
      </div>
      <button type="submit" disabled={sending} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: '#229ED9', color: '#fff', fontWeight: 700, fontSize: 16,
        padding: '15px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(34,158,217,0.35)', opacity: sending ? 0.7 : 1,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.7 13.9l-4.8-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>
        {sending ? 'Секунду…' : (buttonText || 'Перейти в Telegram')}
      </button>
      <p style={{ fontSize: 11, color: '#aab2bd', textAlign: 'center', margin: '2px 0 0' }}>Нажимая кнопку, вы соглашаетесь на обработку данных</p>
    </form>
  )
}
