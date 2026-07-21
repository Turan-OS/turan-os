'use client'

import { useState } from 'react'

// QR-код для короткой ссылки. Генерируется локально (без внешних сервисов).
const OPTS = { margin: 2, color: { dark: '#0E0A1C', light: '#ffffff' }, errorCorrectionLevel: 'M' as const }

export default function QrButton({ url, slug }: { url: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const [png, setPng] = useState('')

  async function show() {
    const QRCode = (await import('qrcode')).default
    setPng(await QRCode.toDataURL(url, { ...OPTS, width: 640 }))
    setOpen(true)
  }

  function download(href: string, name: string) {
    const a = document.createElement('a')
    a.href = href; a.download = name; a.click()
  }

  async function downloadSvg() {
    const QRCode = (await import('qrcode')).default
    const svg = await QRCode.toString(url, { ...OPTS, type: 'svg' })
    download(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), `qr-${slug}.svg`)
  }

  return (
    <>
      <button type="button" onClick={show} className="admin-btn-ghost"
        style={{ fontSize: 12, padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        title="Показать QR-код">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 14v.01M14 20h.01M17 20h.01M20 17v3" />
        </svg>
        QR
      </button>

      {open && (
        <div onClick={e => e.target === e.currentTarget && setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,10,28,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 22px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2329', marginBottom: 4 }}>QR-код</div>
            <div style={{ fontSize: 12.5, color: '#8a929c', marginBottom: 18, wordBreak: 'break-all' }}>{url}</div>

            {png && <img src={png} alt="QR" style={{ width: 240, height: 240, display: 'block', margin: '0 auto 18px', border: '1px solid #eef0f3', borderRadius: 12 }} />}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => download(png, `qr-${slug}.png`)} className="admin-btn-primary" style={{ fontSize: 13 }}>Скачать PNG</button>
              <button onClick={downloadSvg} className="admin-btn-ghost" style={{ fontSize: 13 }}>Скачать SVG</button>
              <button onClick={() => setOpen(false)} className="admin-btn-ghost" style={{ fontSize: 13 }}>Закрыть</button>
            </div>
            <p style={{ fontSize: 11.5, color: '#8a929c', marginTop: 16, lineHeight: 1.5 }}>
              SVG — для печати без потери качества (журнал, баннер). PNG — для соцсетей и мессенджеров.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
