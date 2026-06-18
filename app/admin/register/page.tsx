'use client'

import { useState } from 'react'
import Link from 'next/link'
import TuranLogo from '@/components/TuranLogo'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', background: '#171327',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff',
  fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#9b95b8',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
}

export default function AdminRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setDone(true)
    else { setError(data.error || 'Ошибка регистрации'); setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, minHeight: '100vh', background: 'radial-gradient(1000px 600px at 30% 0%, #291A42 0%, #0E0A1C 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Onest', 'Inter', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TuranLogo size={22} tone="light" />
          <div style={{ fontSize: 11, color: '#6b6388', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Регистрация</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '36px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 60, height: 60, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(30,170,209,0.12)', border: '1px solid rgba(30,170,209,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1EAAD1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Заявка отправлена</div>
              <div style={{ fontSize: 14, color: '#8f88aa', lineHeight: 1.6 }}>Аккаунт ждёт подтверждения администратора. После одобрения сможете войти.</div>
              <Link href="/admin/login" style={{ display: 'inline-block', marginTop: 20, color: '#1EAAD1', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← Ко входу</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label style={labelStyle}>Имя</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Имя Фамилия" required autoFocus style={inputStyle} />
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required style={inputStyle} />
              <label style={labelStyle}>Пароль</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="от 6 символов" required minLength={6} style={{ ...inputStyle, marginBottom: error ? 8 : 20 }} />
              {error && <div style={{ marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', background: loading ? '#3a3550' : '#1EAAD1',
                color: loading ? '#9b95b8' : '#04222b', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(30,170,209,0.32)',
              }}>{loading ? 'Отправка…' : 'Зарегистрироваться'}</button>
            </form>
          )}
        </div>

        {!done && (
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8f88aa' }}>
            Уже есть аккаунт? <Link href="/admin/login" style={{ color: '#1EAAD1', textDecoration: 'none', fontWeight: 600 }}>Войти</Link>
          </div>
        )}
      </div>
    </div>
  )
}
