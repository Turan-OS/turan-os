'use client'

import { useFormStatus } from 'react-dom'

// Кнопка отправки формы (server action) с подтверждением. Блокируется на время отправки.
export default function ConfirmSubmit({ message, title, style, children }: {
  message: string; title?: string; style?: React.CSSProperties; children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      title={title}
      disabled={pending}
      onClick={e => { if (!confirm(message)) e.preventDefault() }}
      style={{ fontFamily: 'inherit', opacity: pending ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  )
}
