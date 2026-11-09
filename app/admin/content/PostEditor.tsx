'use client'

import { useState, useRef } from 'react'
import { createPost, updatePost } from './actions'
import IgPreview from './IgPreview'
import { TYPES, STATUSES, isVideo, type ContentPost, type ContentType, type ContentStatus } from '@/lib/content'

export default function PostEditor({ post }: { post?: ContentPost }) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [description, setDescription] = useState(post?.description ?? '')
  const [caption, setCaption] = useState(post?.caption ?? '')
  const [type, setType] = useState<ContentType>(post?.type ?? 'carousel')
  const [status, setStatus] = useState<ContentStatus>(post?.status ?? 'idea')
  const [publishDate, setPublishDate] = useState(post?.publish_date ?? '')
  const [media, setMedia] = useState<string[]>(post?.media ?? [])
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true); setErr('')
    for (const f of files) {
      const fd = new FormData(); fd.append('file', f); fd.append('folder', 'content')
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data.url) setMedia(m => [...m, data.url])
        else setErr(data.error || 'Ошибка загрузки')
      } catch { setErr('Ошибка загрузки') }
    }
    setUploading(false); if (fileRef.current) fileRef.current.value = ''
  }

  const move = (k: number, dir: -1 | 1) => setMedia(m => {
    const n = [...m]; const t = k + dir
    if (t < 0 || t >= n.length) return m
    ;[n[k], n[t]] = [n[t], n[k]]; return n
  })
  const remove = (k: number) => setMedia(m => m.filter((_, j) => j !== k))

  const action = post ? updatePost : createPost

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* ── форма ── */}
      <form action={action} style={{ flex: '1 1 440px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {post && <input type="hidden" name="id" value={post.id} />}
        <input type="hidden" name="media" value={JSON.stringify(media)} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="caption" value={caption} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="status" value={status} />

        <div>
          <label className="admin-label">Тема</label>
          <input name="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="О чём пост" className="admin-input" style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label className="admin-label">Тип</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  style={chip(type === t.key)}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: '0 0 170px' }}>
            <label className="admin-label">Дата публикации</label>
            <input name="publish_date" type="date" value={publishDate ?? ''} onChange={e => setPublishDate(e.target.value)} className="admin-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <label className="admin-label">Статус</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s.key} type="button" onClick={() => setStatus(s.key)}
                style={{ ...chip(status === s.key), ...(status === s.key ? { background: s.bg, color: s.color, borderColor: s.color } : {}) }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="admin-label">Описание / идея</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Суть, тезисы, что показать на слайдах" className="admin-input" style={{ width: '100%', resize: 'vertical' }} />
        </div>

        {/* слайды */}
        <div>
          <label className="admin-label">Слайды / медиа {media.length > 0 && <span style={{ color: '#8a929c', fontWeight: 400 }}>· {media.length}</span>}</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {media.map((url, k) => (
              <div key={url + k} style={{ position: 'relative', width: 84, height: 84, borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e7ec' }}>
                {isVideo(url)
                  ? <video src={url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <span style={{ position: 'absolute', top: 2, left: 3, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '0 4px' }}>{k + 1}</span>
                <button type="button" onClick={() => remove(k)} title="Удалить" style={miniBtn(2)}>×</button>
                <button type="button" onClick={() => move(k, -1)} disabled={k === 0} title="Левее" style={miniBtn(22)}>‹</button>
                <button type="button" onClick={() => move(k, 1)} disabled={k === media.length - 1} title="Правее" style={miniBtn(42)}>›</button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ width: 84, height: 84, borderRadius: 8, border: '1.5px dashed #c7ccd1', background: '#fafbfc', color: '#8a929c', fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 20 }}>＋</span>{uploading ? '…' : 'Добавить'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          {err && <div style={{ fontSize: 12, color: '#d24a3d' }}>{err}</div>}
        </div>

        <div>
          <label className="admin-label">Подпись (текст публикации)</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5} placeholder="Текст, который пойдёт под постом в Instagram" className="admin-input" style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" className="admin-btn-primary" style={{ padding: '11px 26px' }}>{post ? 'Сохранить' : 'Создать пост'}</button>
        </div>
      </form>

      {/* ── живое превью ── */}
      <div style={{ flex: '0 0 auto', position: 'sticky', top: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8a929c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Как будет выглядеть</div>
        <IgPreview media={media} caption={caption} type={type} date={publishDate || null} />
      </div>
    </div>
  )
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${active ? '#1EAAD1' : '#d7dce3'}`, background: active ? 'rgba(30,170,209,0.1)' : '#fff',
    color: active ? '#127a98' : '#5a626d', fontFamily: 'inherit',
  }
}
function miniBtn(right: number): React.CSSProperties {
  return {
    position: 'absolute', top: 2, right, width: 17, height: 17, borderRadius: 5, border: 'none',
    background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, lineHeight: '15px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  }
}
