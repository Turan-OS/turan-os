'use client'

import { useState } from 'react'

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch { /* clipboard недоступен */ }
      }}
      className="admin-btn-ghost"
      style={{ fontSize: 12, padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
      title="Скопировать короткую ссылку"
    >
      {copied
        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a9a55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg><span style={{ color: '#0a9a55' }}>Скопировано</span></>
        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>Копировать</>}
    </button>
  )
}
