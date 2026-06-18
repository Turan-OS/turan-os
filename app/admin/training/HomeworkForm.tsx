'use client'

import { useState, useRef, useTransition, useEffect } from 'react'

export default function HomeworkForm({
  lessonId, defaultText, rejected, submit, preview,
}: {
  lessonId: number
  defaultText?: string
  rejected?: boolean
  submit: (fd: FormData) => Promise<void>
  preview?: boolean
}) {
  const [text, setText] = useState(defaultText ?? '')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioName, setAudioName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()

  // запись с микрофона
  const [recording, setRecording] = useState(false)
  const [secs, setSecs] = useState(0)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secsRef = useRef(0)

  useEffect(() => () => { stopTracks(); if (timerRef.current) clearInterval(timerRef.current) }, [])

  function stopTracks() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  // общая загрузка blob/файла на сервер
  async function upload(file: File, label: string) {
    setUploading(true); setErr('')
    const fd = new FormData()
    fd.append('file', file); fd.append('folder', 'homework')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) { setAudioUrl(data.url); setAudioName(label) }
      else setErr(data.error || 'Ошибка загрузки')
    } catch { setErr('Ошибка загрузки') }
    finally { setUploading(false) }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) await upload(f, f.name)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function startRec() {
    setErr('')
    if (!navigator.mediaDevices?.getUserMedia) { setErr('Запись недоступна в этом браузере'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = ev => { if (ev.data.size) chunksRef.current.push(ev.data) }
      rec.onstop = async () => {
        const type = rec.mimeType || 'audio/webm'
        const ext = type.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type })
        stopTracks()
        const d = secsRef.current
        const mm = Math.floor(d / 60), ss = String(d % 60).padStart(2, '0')
        await upload(new File([blob], `voice-${Date.now()}.${ext}`, { type }), `🎙 Голосовое (${mm}:${ss})`)
      }
      recRef.current = rec
      rec.start()
      setRecording(true); setSecs(0); secsRef.current = 0
      timerRef.current = setInterval(() => { secsRef.current += 1; setSecs(secsRef.current) }, 1000)
    } catch {
      setErr('Нет доступа к микрофону. Разреши доступ в браузере.')
      stopTracks()
    }
  }

  function stopRec() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setRecording(false)
    recRef.current?.stop()
  }

  function clearAudio() { setAudioUrl(''); setAudioName(''); setSecs(0) }

  const onSubmit = () => {
    if (!text.trim()) { setErr('Напиши ответ'); return }
    const fd = new FormData()
    fd.append('lesson_id', String(lessonId))
    fd.append('submission', text.trim())
    if (audioUrl) fd.append('audio_url', audioUrl)
    start(() => submit(fd))
  }

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div style={{ marginTop: 8 }}>
      <label className="admin-label">{rejected ? 'Исправь и отправь снова' : 'Твой ответ'}</label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} className="admin-input"
        placeholder="Напиши ответ на домашнее задание…" style={{ resize: 'vertical', height: 'auto' }} />

      {/* Голосовое / аудио */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {!recording ? (
          <button type="button" onClick={startRec} disabled={uploading} className="admin-btn-ghost"
            style={{ fontSize: 13, padding: '9px 16px', borderColor: '#f0c9c4', color: '#d24a3d' }}>
            🔴 Записать голосовое
          </button>
        ) : (
          <button type="button" onClick={stopRec} className="admin-btn-primary"
            style={{ fontSize: 13, padding: '9px 16px', background: '#d24a3d', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#fff', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            Остановить · {mmss}
          </button>
        )}

        <input ref={fileRef} type="file" accept="audio/*" onChange={onFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || recording} className="admin-btn-ghost" style={{ fontSize: 13, padding: '9px 16px' }}>
          {uploading ? 'Загрузка…' : '📎 Загрузить файл'}
        </button>
      </div>

      {/* Превью прикреплённого аудио */}
      {audioUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '10px 14px', background: '#f4faf6', border: '1px solid #cfe9f3', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#127a98', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ {audioName || 'аудио'}</span>
          <audio controls src={audioUrl} style={{ height: 34, maxWidth: 240 }} />
          <button type="button" onClick={clearAudio} className="admin-btn-danger" style={{ fontSize: 11, padding: '5px 10px' }}>Удалить</button>
        </div>
      )}

      {err && <div style={{ fontSize: 12, color: '#d24a3d', marginTop: 8 }}>{err}</div>}

      <button type="button" onClick={onSubmit} disabled={pending || uploading || recording || preview} className="admin-btn-primary" style={{ marginTop: 16, padding: '11px 28px', fontSize: 13, opacity: preview ? 0.5 : 1, cursor: preview ? 'not-allowed' : 'pointer' }}>
        {preview ? 'Отправить на проверку (в предпросмотре отключено)' : pending ? 'Отправка…' : 'Отправить на проверку'}
      </button>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  )
}
