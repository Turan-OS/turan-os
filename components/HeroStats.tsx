'use client'

import { useEffect, useRef, useState } from 'react'

type Stat = { target: number; suffix?: string; label: string }

const STATS: Stat[] = [
  { target: 100,  suffix: '+', label: 'мероприятий в год' },
  { target: 70,   suffix: '+', label: 'резидентов' },
  { target: 30,   suffix: '+', label: 'сфер бизнеса' },
  { target: 5000, suffix: '+', label: 'участников встреч' },
]

function CountUp({ run, target }: { run: boolean; target: number }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!run) return
    // уважаем «уменьшить анимацию» в системе — сразу показываем финал
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(target)
      return
    }
    let raf = 0
    const dur = 1600
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic — быстро стартует, плавно тормозит
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf = requestAnimationFrame(tick)
    // страховка: если rAF где-то затормозит (фоновая вкладка) — гарантированно ставим финал
    const safety = setTimeout(() => setVal(target), dur + 500)
    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [run, target])

  return <>{val}</>
}

export default function HeroStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRun(true); io.disconnect() } },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 56, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
      {STATS.map((s, i) => (
        <div key={s.label} style={{ padding: '4px 6px', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <div style={{ fontSize: 'clamp(28px,3.3vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
            <CountUp run={run} target={s.target} />{s.suffix}
          </div>
          <div style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
