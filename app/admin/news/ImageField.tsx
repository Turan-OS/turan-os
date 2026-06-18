'use client'

import { useState, useRef } from 'react'

export default function ImageField({ initialUrl, folder = 'news' }: { initialUrl?: string; folder?: string }) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true); setErr('')
    const fd = new FormData()
    fd.append('file', f); fd.append('folder', folder)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) setUrl(data.url)
      else setErr(data.error || 'Ошибка загрузки')
    } catch { setErr('Ошибка загрузки') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="admin-label">Картинка</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input name="image_url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Вставь ссылку или загрузи файл →" className="admin-input" style={{ flex: '1 1 280px' }} />
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="admin-btn-ghost" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
          {uploading ? 'Загрузка…' : '📎 Загрузить файл'}
        </button>
      </div>
      {err && <div style={{ fontSize: 12, color: '#d24a3d', marginTop: 6 }}>{err}</div>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ marginTop: 12, maxWidth: 320, width: '100%', borderRadius: 10, border: '1px solid #e4e7ec' }} />
      )}
    </div>
  )
}
