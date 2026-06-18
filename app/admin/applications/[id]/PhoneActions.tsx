'use client'

import { useEffect, useRef, useState } from 'react'

export default function PhoneActions({ phone, telegram, saveContact }: {
  phone: string
  telegram?: string | null
  saveContact: (fd: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const digits = (phone || '').replace(/[^\d]/g, '')
  const tgHandle = (telegram || '').trim()
  const tgUrl = /t\.me|^https?:\/\//i.test(tgHandle)
    ? tgHandle
    : tgHandle.startsWith('@') ? `https://t.me/${tgHandle.slice(1)}` : `https://t.me/+${digits}`
  const waUrl = `https://wa.me/${digits}`

  const item: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', width: '100%',
    fontSize: 13.5, color: '#1f2329', textDecoration: 'none', whiteSpace: 'nowrap',
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
  }
  const sep = { borderTop: '1px solid #f2f4f7' }

  if (editing) {
    return (
      <form action={async (fd) => { await saveContact(fd); setEditing(false) }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input name="contact" defaultValue={phone} autoFocus placeholder="Телефон"
          style={{ flex: 1, padding: '7px 11px', fontSize: 14, border: '1px solid #d7dce3', borderRadius: 8, background: '#fff', color: '#1f2329', outline: 'none' }} />
        <button type="submit" className="admin-btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>OK</button>
        <button type="button" onClick={() => setEditing(false)} style={{ padding: '7px 10px', fontSize: 12, background: '#fff', border: '1px solid #d7dce3', borderRadius: 8, color: '#5b6470', cursor: 'pointer' }}>✕</button>
      </form>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f4faf6', border: '1px solid #cfe9f3', color: '#127a98', fontWeight: 600, fontSize: 14, padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
        📞 {phone}
        <span style={{ fontSize: 10, color: '#9aa3ad' }}>▾</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30, background: '#fff', borderRadius: 11, boxShadow: '0 8px 28px rgba(0,0,0,0.25)', overflow: 'hidden', minWidth: 230, border: '1px solid #e4e7ec' }}>
          <a href={`tel:${phone}`} style={item} onClick={() => setOpen(false)}><span style={{ fontSize: 16 }}>📞</span> Позвонить</a>
          <a href={tgUrl} target="_blank" rel="noopener noreferrer" style={{ ...item, ...sep }} onClick={() => setOpen(false)}><span style={{ fontSize: 16 }}>✈️</span> Написать в Telegram</a>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ ...item, ...sep }} onClick={() => setOpen(false)}><span style={{ fontSize: 16 }}>🟢</span> Написать в WhatsApp</a>
          <button style={{ ...item, ...sep }} onClick={() => { navigator.clipboard?.writeText(phone); setCopied(true); setTimeout(() => { setCopied(false); setOpen(false) }, 700) }}>
            <span style={{ fontSize: 16 }}>⧉</span> {copied ? 'Скопировано ✓' : 'Копировать'}
          </button>
          <button style={{ ...item, ...sep }} onClick={() => { setEditing(true); setOpen(false) }}><span style={{ fontSize: 16 }}>✏️</span> Редактировать</button>
        </div>
      )}
    </div>
  )
}
