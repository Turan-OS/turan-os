'use client'

import { useFormStatus } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

// Кнопка «Сохранить шаг» с обратной связью: «Сохраняем…» → «✓ Сохранено».
export default function SaveStepButton() {
  const { pending } = useFormStatus()
  const [saved, setSaved] = useState(false)
  const was = useRef(false)

  useEffect(() => {
    if (pending) { was.current = true; setSaved(false); return }
    if (was.current) {
      was.current = false
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [pending])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
      <button type="submit" disabled={pending} className="admin-btn-primary"
        style={{ padding: '10px 24px', fontSize: 13, opacity: pending ? 0.7 : 1 }}>
        {pending ? 'Сохраняем…' : 'Сохранить шаг'}
      </button>
      {saved && (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#00a35c', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Сохранено
        </span>
      )}
    </div>
  )
}
