'use client'

import { useState } from 'react'
import type { HrQuestion } from '@/lib/hrStages'

const G = '#1EAAD1'
const label: React.CSSProperties = { fontSize: 13, color: '#c7c4d6', marginBottom: 7, display: 'block', fontWeight: 500 }
const field: React.CSSProperties = {
  width: '100%', background: '#171327', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9,
  padding: '12px 15px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function JobForm({ slug, questions }: { slug: string; questions: HrQuestion[] }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const setAns = (k: string, v: string) => setAnswers(a => ({ ...a, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setError('')
    try {
      const res = await fetch('/api/hr/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, contact, answers }),
      })
      if (!res.ok) throw new Error('failed')
      setSent(true)
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз.')
    } finally { setSending(false) }
  }

  if (sent) return (
    <div style={{ marginTop: 32, background: 'rgba(30,170,209,0.08)', border: '1px solid rgba(30,170,209,0.3)', borderRadius: 16, padding: '40px 28px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(30,170,209,0.14)', border: '1px solid rgba(30,170,209,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Отклик отправлен!</div>
      <div style={{ color: '#9b98ad', fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>Спасибо! Рекрутер рассмотрит вашу заявку и свяжется с вами.</div>
    </div>
  )

  return (
    <form onSubmit={submit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={label}>Имя *</label>
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ваше имя" style={field} />
      </div>
      <div>
        <label style={label}>Телефон / контакт *</label>
        <input value={contact} onChange={e => setContact(e.target.value)} required placeholder="+998 (__) ___-__-__" style={field} />
      </div>

      {questions.map(q => (
        <div key={q.key}>
          <label style={label}>{q.label}{q.required ? ' *' : ''}</label>
          {q.type === 'textarea' ? (
            <textarea value={answers[q.key] ?? ''} onChange={e => setAns(q.key, e.target.value)} required={q.required} rows={3} style={{ ...field, resize: 'vertical' }} />
          ) : q.type === 'select' ? (
            <select value={answers[q.key] ?? ''} onChange={e => setAns(q.key, e.target.value)} required={q.required} style={field}>
              <option value="" disabled>Выберите…</option>
              {(q.options ?? []).map(o => <option key={o} value={o} style={{ color: '#000' }}>{o}</option>)}
            </select>
          ) : (
            <input
              type={q.type === 'phone' ? 'tel' : q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text'}
              value={answers[q.key] ?? ''} onChange={e => setAns(q.key, e.target.value)} required={q.required} style={field} />
          )}
        </div>
      ))}

      {error && <div style={{ color: '#ff6b6b', fontSize: 14 }}>{error}</div>}

      <button type="submit" disabled={sending} style={{
        background: G, color: '#04222b', padding: '15px', borderRadius: 10, fontWeight: 700, fontSize: 16,
        border: 'none', cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.7 : 1, marginTop: 4,
      }}>
        {sending ? 'Отправляем…' : 'Откликнуться'}
      </button>
      <p style={{ color: '#6b6880', fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
      </p>
    </form>
  )
}
