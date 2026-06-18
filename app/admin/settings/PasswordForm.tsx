'use client'

import { useState } from 'react'

const inp: React.CSSProperties = { width: '100%', maxWidth: 360, padding: '10px 13px', fontSize: 14, border: '1px solid #d7dce3', borderRadius: 9, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff', marginBottom: 10 }

export default function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) { setMsg({ ok: true, text: 'Пароль изменён' }); setCurrent(''); setNext('') }
    else setMsg({ ok: false, text: data.error || 'Ошибка' })
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 360 }}>
      <label className="admin-label">Текущий пароль</label>
      <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required style={inp} />
      <label className="admin-label">Новый пароль</label>
      <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={6} placeholder="от 6 символов" style={inp} />
      {msg && <div style={{ fontSize: 13, marginBottom: 10, color: msg.ok ? '#127a98' : '#d24a3d' }}>{msg.ok ? '✓ ' : ''}{msg.text}</div>}
      <button type="submit" disabled={loading} className="admin-btn-primary" style={{ padding: '10px 24px' }}>{loading ? 'Сохранение…' : 'Сменить пароль'}</button>
    </form>
  )
}
