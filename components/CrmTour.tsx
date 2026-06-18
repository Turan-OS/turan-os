'use client'

import { useEffect, useLayoutEffect, useState, useCallback } from 'react'

export type TourStep = { selector?: string; title: string; text: string }

const TIP_W = 330

export default function CrmTour({ steps, storageKey, buttonLabel = 'Обучение' }: {
  steps: TourStep[]
  storageKey: string
  buttonLabel?: string
}) {
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const step = steps[i]

  // первый визит — запускаем тур автоматически (после рендера страницы)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(storageKey)) {
      const t = setTimeout(() => setActive(true), 700)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  const measure = useCallback(() => {
    if (!active) return
    const sel = steps[i].selector
    if (!sel) { setRect(null); return }
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setRect(el.getBoundingClientRect())
  }, [active, i, steps])

  useLayoutEffect(() => { measure() }, [measure])
  useEffect(() => {
    if (!active) return
    const t = setTimeout(measure, 350)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [active, measure])

  const finish = () => { localStorage.setItem(storageKey, '1'); setActive(false); setI(0) }
  const start = () => { setI(0); setActive(true) }
  const next = () => { if (i < steps.length - 1) setI(i + 1); else finish() }
  const prev = () => { if (i > 0) setI(i - 1) }

  const launcher = (
    <button onClick={start} title={buttonLabel}
      style={{
        position: 'fixed', right: 22, bottom: 22, zIndex: 9990,
        background: '#00c46f', color: '#fff', border: 'none', borderRadius: 24,
        padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,150,80,0.35)', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
      <span style={{ fontSize: 15 }}>❔</span> {buttonLabel}
    </button>
  )

  if (!active) return launcher

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const M = 14, TIP_H = 200
  let tipStyle: React.CSSProperties
  if (rect) {
    const clampX = (x: number) => Math.min(Math.max(16, x), vw - TIP_W - 16)
    if (vh - rect.bottom > TIP_H + M) {
      // снизу
      tipStyle = { top: rect.bottom + M, left: clampX(rect.left) }
    } else if (rect.top > TIP_H + M) {
      // сверху
      tipStyle = { top: rect.top - M, left: clampX(rect.left), transform: 'translateY(-100%)' }
    } else {
      // высокий элемент — ставим сбоку, по центру по вертикали
      const top = Math.min(Math.max(TIP_H / 2 + 16, rect.top + rect.height / 2), vh - TIP_H / 2 - 16)
      if (rect.right + TIP_W + M < vw - 8) {
        tipStyle = { top, left: rect.right + M, transform: 'translateY(-50%)' }
      } else if (rect.left - TIP_W - M > 8) {
        tipStyle = { top, left: rect.left - M, transform: 'translate(-100%, -50%)' }
      } else {
        tipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      }
    }
  } else {
    tipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9991, background: rect ? 'transparent' : 'rgba(15,20,25,0.55)' }} />

      {rect && (
        <div style={{
          position: 'fixed', zIndex: 9992, pointerEvents: 'none',
          top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
          borderRadius: 12, border: '2px solid #1EAAD1',
          boxShadow: '0 0 0 9999px rgba(15,20,25,0.55)', transition: 'all 0.2s',
        }} />
      )}

      <div style={{
        position: 'fixed', zIndex: 9993, width: TIP_W, maxWidth: 'calc(100vw - 32px)',
        background: '#fff', borderRadius: 14, padding: '18px 20px',
        boxShadow: '0 18px 50px rgba(16,24,40,0.35)', ...tipStyle,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00a35c', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>
          Шаг {i + 1} из {steps.length}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2329', marginBottom: 8 }}>{step.title}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#5b6470', marginBottom: 18 }}>{step.text}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={finish} style={{ fontSize: 12, color: '#8a929c', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginRight: 'auto' }}>Пропустить</button>
          {i > 0 && <button onClick={prev} className="admin-btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}>Назад</button>}
          <button onClick={next} className="admin-btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
            {i < steps.length - 1 ? 'Далее' : 'Понятно'}
          </button>
        </div>
      </div>
    </>
  )
}
