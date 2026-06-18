'use client'

import { useState } from 'react'

const C = '#1EAAD1'
const D = '#291A42'

const invoiceTiers = [
  { label: 'до 20', add: 0 },
  { label: '20–50', add: 700_000 },
  { label: '50–150', add: 1_600_000 },
  { label: '150+', add: 3_200_000 },
]

function fmt(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

export default function CostCalculator() {
  const [employees, setEmployees] = useState(5)
  const [invoiceTier, setInvoiceTier] = useState(0)
  const [vat, setVat] = useState(false)
  const [cashbox, setCashbox] = useState(false)
  const [foreign, setForeign] = useState(false)

  // Ориентировочная формула (сум/мес). Точную цену считают после аудита.
  const base = 1_200_000
  const price =
    base +
    employees * 120_000 +
    invoiceTiers[invoiceTier].add +
    (vat ? 900_000 : 0) +
    (cashbox ? 350_000 : 0) +
    (foreign ? 600_000 : 0)

  const open = () => window.dispatchEvent(new CustomEvent('openApplyModal'))

  const cell: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 10,
  }
  const toggleBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
    border: `1px solid ${active ? C : '#d7d4e0'}`,
    background: active ? 'rgba(30,170,209,0.1)' : '#fff',
    color: active ? '#127a98' : '#6a6680', fontWeight: 600, fontSize: 14,
    fontFamily: 'inherit', transition: 'all .18s', textAlign: 'center',
  })

  return (
    <div className="calc-wrap" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 70px rgba(41,26,66,0.18)', border: '1px solid #e7e4ef' }}>
      {/* Левая часть — параметры */}
      <div style={{ background: '#fff', padding: 'clamp(28px,3.4vw,42px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }} className="calc-fields">
          {/* Сотрудники */}
          <div style={{ ...cell, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={{ color: D, fontWeight: 600, fontSize: 14.5 }}>Сотрудников</label>
              <span style={{ color: C, fontWeight: 800, fontSize: 18 }}>{employees}</span>
            </div>
            <input type="range" min={1} max={50} value={employees} onChange={e => setEmployees(+e.target.value)}
              style={{ width: '100%', accentColor: C, cursor: 'pointer' }} />
          </div>

          {/* Счёт-фактуры */}
          <div style={{ ...cell, gridColumn: '1 / -1' }}>
            <label style={{ color: D, fontWeight: 600, fontSize: 14.5 }}>Счёт-фактур в месяц</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {invoiceTiers.map((t, i) => (
                <button key={t.label} type="button" onClick={() => setInvoiceTier(i)} style={toggleBtn(invoiceTier === i)}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Тумблеры */}
          <div style={cell}>
            <label style={{ color: D, fontWeight: 600, fontSize: 14.5 }}>Плательщик НДС</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setVat(false)} style={toggleBtn(!vat)}>Нет</button>
              <button type="button" onClick={() => setVat(true)} style={toggleBtn(vat)}>Да</button>
            </div>
          </div>
          <div style={cell}>
            <label style={{ color: D, fontWeight: 600, fontSize: 14.5 }}>Кассовый аппарат</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setCashbox(false)} style={toggleBtn(!cashbox)}>Нет</button>
              <button type="button" onClick={() => setCashbox(true)} style={toggleBtn(cashbox)}>Да</button>
            </div>
          </div>
          <div style={{ ...cell, gridColumn: '1 / -1' }}>
            <label style={{ color: D, fontWeight: 600, fontSize: 14.5 }}>Иностранные учредители / ВЭД</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setForeign(false)} style={toggleBtn(!foreign)}>Нет</button>
              <button type="button" onClick={() => setForeign(true)} style={toggleBtn(foreign)}>Да</button>
            </div>
          </div>
        </div>
      </div>

      {/* Правая часть — результат */}
      <div style={{ background: `linear-gradient(160deg, ${D} 0%, #1a1130 100%)`, padding: 'clamp(28px,3.4vw,42px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,170,209,0.25) 0%, transparent 65%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 10 }}>Ориентировочно</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(30px,3.6vw,44px)', lineHeight: 1 }}>от {fmt(price)}</span>
          </div>
          <p style={{ color: C, fontWeight: 700, fontSize: 16, marginTop: 4 }}>сум / месяц</p>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: '22px 0 24px' }}>
            Предварительная оценка. Точную стоимость и состав услуг зафиксируем после
            бесплатного аудита вашего учёта.
          </p>

          <button onClick={open} className="apply-cta" style={{ width: '100%', justifyContent: 'center', padding: '15px' }}>
            Получить точный расчёт
            <svg className="apply-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <style>{`
        @media(max-width:760px){
          .calc-wrap { grid-template-columns: 1fr !important; }
        }
        @media(max-width:480px){
          .calc-fields { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
