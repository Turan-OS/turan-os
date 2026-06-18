'use client'

import { useState, useTransition } from 'react'

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #d7dce3', borderRadius: 8, color: '#1f2329', outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '12px 0 6px' }

export default function AddDealButton({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const submit = (fd: FormData) => start(async () => { await action(fd); setOpen(false) })

  return (
    <>
      <button onClick={() => setOpen(true)} className="admin-btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>+ Добавить заявку</button>

      {open && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,25,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form action={submit} style={{ background: '#fff', borderRadius: 16, padding: '26px 28px', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(16,24,40,0.35)', maxHeight: 'calc(100dvh - 40px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2329' }}>Новая заявка</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#aab2bd', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <p style={{ fontSize: 12.5, color: '#8a929c', marginBottom: 6 }}>Контакт в базе создастся автоматически и привяжется к этой заявке.</p>

            <label style={lbl}>Имя</label>
            <input name="name" style={inp} placeholder="Имя и фамилия" autoFocus />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Телефон</label><input name="phone" style={inp} placeholder="+998…" /></div>
              <div><label style={lbl}>Telegram</label><input name="telegram" style={inp} placeholder="@username" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Сфера</label><input name="sphere" style={inp} placeholder="IT, ритейл…" /></div>
              <div><label style={lbl}>Оборот</label><input name="turnover" style={inp} placeholder="$ / мес или год" /></div>
            </div>

            <label style={lbl}>Источник</label>
            <input name="source" style={inp} placeholder="Знакомство, рекомендация…" />

            <label style={lbl}>Комментарий</label>
            <textarea name="comment" rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Где познакомились, договорённости…" />

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="submit" disabled={pending} className="admin-btn-primary" style={{ padding: '11px 24px', fontSize: 13, opacity: pending ? 0.6 : 1 }}>
                {pending ? 'Создаём…' : 'Создать заявку'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="admin-btn-ghost">Отмена</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
