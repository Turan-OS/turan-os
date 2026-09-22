'use client'

import { useRef, useState, useTransition } from 'react'

// Поле ответа в диалоге. Отправляет серверному действию, очищается после отправки.
export default function ReplyBox({ chatId, action }: { chatId: number; action: (fd: FormData) => Promise<void> }) {
  const [text, setText] = useState('')
  const [pending, start] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  const send = () => {
    const t = text.trim()
    if (!t || pending) return
    const fd = new FormData()
    fd.append('chat_id', String(chatId))
    fd.append('text', t)
    start(async () => { await action(fd); setText(''); ref.current?.focus() })
  }

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #eef0f3', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        placeholder="Ответить…  (Enter — отправить, Shift+Enter — перенос строки)"
        rows={1}
        disabled={pending}
        style={{
          flex: 1, resize: 'none', maxHeight: 120, minHeight: 40, padding: '10px 13px', fontSize: 13.5,
          border: '1px solid #d7dce3', borderRadius: 10, outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
        }}
      />
      <button type="button" onClick={send} disabled={pending || !text.trim()} className="admin-btn-primary"
        style={{ padding: '10px 20px', opacity: pending || !text.trim() ? 0.55 : 1, cursor: pending || !text.trim() ? 'default' : 'pointer', flexShrink: 0 }}>
        {pending ? '…' : 'Отправить'}
      </button>
    </div>
  )
}
