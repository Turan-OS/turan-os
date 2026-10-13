'use client'

import { useState } from 'react'

const G = '#1EAAD1'

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

// метки рекламы (первое касание в приоритете)
function getAttrib(): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem('turan_attrib') || '{}')
    const p = new URLSearchParams(window.location.search)
    const cur: Record<string, string> = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'tgid'].forEach(k => { const v = p.get(k); if (v) cur[k] = v.slice(0, 200) })
    return { landing_url: window.location.href.split('#')[0], landing_slug: 'consultation', ...cur, ...stored }
  } catch { return { landing_slug: 'consultation' } }
}

export default function ConsultForm({ id = 'form' }: { id?: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const localDigits = phone.replace(/\D/g, '').replace(/^998/, '')
  const valid = localDigits.length === 9 && name.trim().length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) { setError(localDigits.length !== 9 ? 'Введите номер телефона полностью' : 'Укажите имя'); return }
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: phone, motivation: comment.trim(), ...getAttrib() }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch { setError('Не удалось отправить. Попробуйте ещё раз или позвоните нам.') }
    finally { setSending(false) }
  }

  const field: React.CSSProperties = {
    width: '100%', background: '#171327', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11,
    padding: '14px 16px', color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 13, color: '#c7c4d6', marginBottom: 7, display: 'block', fontWeight: 500 }

  if (sent) return (
    <div id={id} style={{ background: 'rgba(30,170,209,0.08)', border: '1px solid rgba(30,170,209,0.3)', borderRadius: 18, padding: '44px 28px', textAlign: 'center' }}>
      <div style={{ width: 66, height: 66, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(30,170,209,0.14)', border: '1px solid rgba(30,170,209,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, marginBottom: 10, color: '#fff' }}>Заявка принята!</div>
      <div style={{ color: '#9b98ad', fontSize: 15.5, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>Менеджер свяжется с вами в ближайшее время, разберёт вашу ситуацию и рассчитает стоимость.</div>
    </div>
  )

  return (
    <form id={id} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Ваше имя</label>
        <input value={name} onChange={e => { setName(e.target.value); if (error) setError('') }} required placeholder="Имя" style={field} />
      </div>
      <div>
        <label style={lbl}>Телефон</label>
        <input value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); if (error) setError('') }} required inputMode="tel" placeholder="+998 90 123 45 67" style={{ ...field, borderColor: error && localDigits.length !== 9 ? '#e0574a' : 'rgba(255,255,255,0.12)' }} />
      </div>
      <div>
        <label style={lbl}>Комментарий <span style={{ color: '#6b6880' }}>(необязательно)</span></label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Сфера бизнеса, вопрос…" style={{ ...field, resize: 'vertical' }} />
      </div>
      {error && <div style={{ color: '#ff6b6b', fontSize: 14 }}>{error}</div>}
      <button type="submit" disabled={sending || !valid} style={{
        background: G, color: '#04222b', padding: '16px', borderRadius: 12, fontWeight: 800, fontSize: 17,
        border: 'none', cursor: (sending || !valid) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        opacity: (sending || !valid) ? 0.55 : 1, transition: 'opacity .15s',
      }}>{sending ? 'Отправляем…' : 'Получить бесплатную консультацию'}</button>
      <p style={{ color: '#6b6880', fontSize: 12, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
      </p>
    </form>
  )
}
