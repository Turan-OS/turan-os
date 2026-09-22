'use client'

type Fbq = ((...args: unknown[]) => void) | undefined

export default function CtaButton({ slug, buttonText, pixel, contentName, contentCategory }: {
  slug: string; buttonText: string; pixel: boolean; contentName: string; contentCategory: string
}) {
  const onClick = () => {
    if (pixel) {
      const fbq = (window as unknown as { fbq?: Fbq }).fbq
      try { fbq?.('track', 'Lead', { content_name: contentName, content_category: contentCategory }) } catch {}
    }
    // даём событию уйти и переходим в Telegram (через учёт клика).
    // Тащим метки рекламы в /go, чтобы источник дошёл до воронки и заявки.
    const qs = typeof window !== 'undefined' ? (window.location.search || '') : ''
    window.location.href = `/lp/${slug}/go${qs}`
  }

  return (
    <button onClick={onClick} style={{
      marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%',
      background: '#1EAAD1', color: '#04222b', fontWeight: 700, fontSize: 16,
      padding: '15px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
      boxShadow: '0 6px 18px rgba(34,158,217,0.35)', fontFamily: 'inherit',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.7 13.9l-4.8-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>
      {buttonText}
    </button>
  )
}
