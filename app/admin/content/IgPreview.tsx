'use client'

import { useState } from 'react'
import { isVideo, type ContentType } from '@/lib/content'

export default function IgPreview({
  media, caption, type = 'carousel', account = 'turan_os', date,
}: {
  media: string[]; caption?: string; type?: ContentType; account?: string; date?: string | null
}) {
  const [i, setI] = useState(0)
  const slides = media.length ? media : []
  const idx = Math.min(i, Math.max(0, slides.length - 1))
  const vertical = type === 'reel' || type === 'story'
  const ratio = vertical ? '9 / 16' : '1 / 1'
  const cur = slides[idx]

  return (
    <div style={{ width: 340, maxWidth: '100%', border: '1px solid #dbdbdb', borderRadius: 10, background: '#fff', overflow: 'hidden', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      {/* шапка аккаунта */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', padding: 2 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1EAAD1' }}>
            {account.slice(0, 1).toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{account}</div>
        <div style={{ marginLeft: 'auto', color: '#111', fontSize: 18, lineHeight: 1 }}>⋯</div>
      </div>

      {/* медиа */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {cur ? (
          isVideo(cur)
            ? <video src={cur} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={cur} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: '#b7bdc6', fontSize: 13, textAlign: 'center', padding: 20 }}>
            {type === 'text' ? 'Текстовый пост' : 'Нет изображений — загрузите слайды'}
          </div>
        )}

        {/* счётчик слайдов (карусель) */}
        {slides.length > 1 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
            {idx + 1}/{slides.length}
          </div>
        )}
        {/* стрелки */}
        {slides.length > 1 && idx > 0 && (
          <button type="button" onClick={() => setI(idx - 1)} aria-label="Назад" style={navBtn('left')}>‹</button>
        )}
        {slides.length > 1 && idx < slides.length - 1 && (
          <button type="button" onClick={() => setI(idx + 1)} aria-label="Вперёд" style={navBtn('right')}>›</button>
        )}
        {vertical && cur && (
          <div style={{ position: 'absolute', bottom: 8, left: 10, color: '#fff', fontSize: 11, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {type === 'reel' ? '▶ Reels' : 'Stories'}
          </div>
        )}
      </div>

      {/* точки-индикаторы */}
      {slides.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 0 2px' }}>
          {slides.map((_, k) => (
            <span key={k} onClick={() => setI(k)} style={{ width: 6, height: 6, borderRadius: '50%', cursor: 'pointer', background: k === idx ? '#1EAAD1' : '#c7ccd1' }} />
          ))}
        </div>
      )}

      {/* панель действий */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px 2px', fontSize: 20, color: '#111' }}>
        <span>♡</span><span>💬</span><span>➤</span>
        <span style={{ marginLeft: 'auto' }}>🔖</span>
      </div>

      {/* подпись */}
      <div style={{ padding: '2px 12px 14px' }}>
        {caption ? (
          <div style={{ fontSize: 13, color: '#111', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
            <b>{account}</b> {caption}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#b7bdc6' }}>Подпись не заполнена</div>
        )}
        {date && (
          <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>
    </div>
  )
}

function navBtn(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
    width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.85)', color: '#111', fontSize: 18, lineHeight: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  }
}
