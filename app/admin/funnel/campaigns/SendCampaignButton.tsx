'use client'

import { useFormStatus } from 'react-dom'

// Кнопка «Отправить всем» с подтверждением и индикатором отправки.
export default function SendCampaignButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      onClick={(e) => {
        if (!confirm(`Отправить сообщение всем подписчикам бота (${count})? Отменить отправку после старта нельзя.`)) {
          e.preventDefault()
        }
      }}
      className="admin-btn-primary"
      style={{ padding: '12px 26px', fontSize: 14, opacity: pending || count === 0 ? 0.6 : 1 }}
    >
      {pending ? 'Ставим в очередь…' : `Отправить всем (${count})`}
    </button>
  )
}
