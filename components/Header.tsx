'use client'

import Link from 'next/link'
import { useState } from 'react'
import ApplyButton from '@/components/ApplyButton'
import TuranLogo from '@/components/TuranLogo'

const nav = [
  { href: '/#services',   label: 'Услуги' },
  { href: '/#industries', label: 'Кому подходит' },
  { href: '/#why',        label: 'Почему мы' },
  { href: '/#process',    label: 'Как работаем' },
  { href: '/news',        label: 'Статьи' },
  { href: '/#contacts',   label: 'Контакты' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(14,10,28,0.86)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 48px',
        height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>

        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <TuranLogo size={22} tone="light" />
        </Link>

        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="hdr-nav">
          {nav.map(l => (
            <Link key={l.href} href={l.href} style={{
              color: 'rgba(255,255,255,0.62)', textDecoration: 'none',
              fontSize: 14.5, fontWeight: 500,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.62)')}
            >{l.label}</Link>
          ))}
        </nav>

        <div className="hdr-cta-wrap" style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <a href="tel:+998974314000" className="hdr-phone" style={{ color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            +998 97 431-40-00
          </a>
          <ApplyButton variant="header" />
        </div>

        <button onClick={() => setOpen(!open)} className="hdr-burger" style={{
          display: 'none', background: 'none', border: 'none',
          color: '#fff', fontSize: 24, cursor: 'pointer',
        }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div style={{ background: '#0E0A1C', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 32px 28px' }}>
          {nav.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              display: 'block', color: '#cfcfe0', textDecoration: 'none',
              padding: '14px 0', fontSize: 17,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>{l.label}</Link>
          ))}
          <a href="tel:+998974314000" style={{ display: 'block', color: '#fff', fontWeight: 700, padding: '16px 0 4px', fontSize: 17, textDecoration: 'none' }}>
            +998 97 431-40-00
          </a>
          <ApplyButton variant="mobile" label="Оставить заявку" />
        </div>
      )}

      <style>{`
        @media(max-width:1024px){
          .hdr-nav { display: none !important; }
          .hdr-cta-wrap { display: none !important; }
          .hdr-burger { display: block !important; }
        }
        @media(max-width:1180px){ .hdr-phone { display: none !important; } }
      `}</style>
    </header>
  )
}
