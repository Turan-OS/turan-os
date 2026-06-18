'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TuranLogo from '@/components/TuranLogo'

const card: React.CSSProperties = { width: '100%', maxWidth: 380, padding: '0 24px' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', background: '#171327',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff',
  fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#9b95b8',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
}

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push(data.role === 'manager' ? '/admin/applications' : '/admin')
      router.refresh()
    } else {
      setError(data.error || 'Ошибка входа'); setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, minHeight: '100vh', background: 'radial-gradient(1000px 600px at 30% 0%, #291A42 0%, #0E0A1C 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Onest', 'Inter', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TuranLogo size={22} tone="light" />
          <div style={{ fontSize: 11, color: '#6b6388', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Панель управления</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '36px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Вход</h1>
          <form onSubmit={submit}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus style={inputStyle} />
            <label style={labelStyle}>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, marginBottom: error ? 8 : 20 }} />
            {error && <div style={{ marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? '#3a3550' : '#1EAAD1',
              color: loading ? '#9b95b8' : '#04222b', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(30,170,209,0.32)',
            }}>{loading ? 'Вход…' : 'Войти'}</button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8f88aa' }}>
          Нет аккаунта? <Link href="/admin/register" style={{ color: '#1EAAD1', textDecoration: 'none', fontWeight: 600 }}>Зарегистрироваться</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <a href="/" style={{ fontSize: 12, color: '#6b6388', textDecoration: 'none' }}>← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  )
}
