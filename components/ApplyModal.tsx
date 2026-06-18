'use client'

import { useState, useEffect } from 'react'

const G = '#1EAAD1'

// общие стили полей
const labelStyle: React.CSSProperties = { fontSize: 12.5, color: '#9a98ad', marginBottom: 6 }
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#171327', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function ApplyModal() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', contact: '', motivation: '' })

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('openApplyModal', handler)
    return () => window.removeEventListener('openApplyModal', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('failed')
      setSent(true)
      setForm({ name: '', contact: '', motivation: '' })
      setTimeout(() => { setOpen(false); setSent(false) }, 3000)
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div onClick={e => e.target === e.currentTarget && setOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(8,6,16,0.9)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#0E0A1C', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 520, position: 'relative',
        maxHeight: 'calc(100dvh - 40px)', overflowY: 'auto',
      }}>
        <button onClick={() => setOpen(false)} style={{
          position: 'absolute', top: 18, right: 20,
          background: 'none', border: 'none', color: '#666', fontSize: 22, cursor: 'pointer',
          zIndex: 2, lineHeight: 1,
        }}>✕</button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 8px 24px' }}>
            <div style={{
              width: 68, height: 68, margin: '0 auto 24px', borderRadius: '50%',
              background: 'rgba(30,170,209,0.12)', border: '1px solid rgba(30,170,209,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 28px rgba(30,170,209,0.25)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.01em' }}>Заявка принята</div>
            <div style={{ color: '#8a879c', fontSize: 15, lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
              Спасибо! Менеджер свяжется с вами в ближайшее время и рассчитает стоимость.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Оставить заявку</div>
            <div style={{ color: '#7a7790', fontSize: 14, marginBottom: 20 }}>Менеджер перезвонит и рассчитает стоимость под ваш бизнес</div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={labelStyle}>Ваше имя</div>
                <input type="text" placeholder="Имя" required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={labelStyle}>Телефон</div>
                <input type="tel" placeholder="+998 (99) - 999 - 9999" required
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={labelStyle}>Комментарий <span style={{ textTransform: 'none', letterSpacing: 0, color: '#5b586e', fontWeight: 400 }}>(необязательно)</span></div>
                <textarea placeholder="Введите ваш комментарий" rows={2}
                  value={form.motivation}
                  onChange={e => setForm({ ...form, motivation: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{ color: '#ff6b6b', fontSize: 13, lineHeight: 1.5 }}>{error}</div>
              )}

              <button type="submit" disabled={sending} style={{
                background: G, color: '#04222b', padding: '13px',
                borderRadius: 8, fontWeight: 700, fontSize: 16, marginTop: 2,
                border: 'none', cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: sending ? 0.7 : 1,
              }}>
                {sending ? 'Отправляем…' : 'Отправить заявку'}
              </button>
              <p style={{ color: '#5b586e', fontSize: 11.5, lineHeight: 1.5, textAlign: 'center' }}>
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
