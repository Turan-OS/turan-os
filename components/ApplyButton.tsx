'use client'

const G = '#1EAAD1'

interface Props {
  label?: string
  variant?: 'primary' | 'header' | 'mobile' | 'section'
}

const Arrow = () => (
  <svg className="apply-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ApplyButton({ label = 'Оставить заявку', variant = 'primary' }: Props) {
  const open = () => window.dispatchEvent(new CustomEvent('openApplyModal'))

  if (variant === 'header') return (
    <button onClick={open} className="apply-cta hdr-cta" style={{ padding: '11px 24px', fontSize: 15 }}>
      <span>{label}</span><Arrow />
    </button>
  )

  if (variant === 'mobile') return (
    <button onClick={open} className="apply-cta" style={{ width: '100%', marginTop: 20, padding: '15px', fontSize: 16, justifyContent: 'center' }}>
      <span>{label}</span><Arrow />
    </button>
  )

  if (variant === 'section') return (
    <button onClick={open} className="apply-cta apply-cta-lg" style={{ padding: '18px 44px', fontSize: 17 }}>
      <span>{label}</span><Arrow />
    </button>
  )

  return (
    <button onClick={open} className="apply-cta" style={{ padding: '15px 34px', fontSize: 15 }}>
      <span>{label}</span><Arrow />
    </button>
  )
}
