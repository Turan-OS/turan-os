'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

type Bot = { id: number; username: string; count: number }

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8a929c', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' }

function SubmitBtn({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || count === 0}
      onClick={(e) => { if (!confirm(`Отправить сообщение ${count} подписчикам этого бота? Отменить после старта нельзя.`)) e.preventDefault() }}
      className="admin-btn-primary" style={{ padding: '12px 26px', fontSize: 14, opacity: pending || count === 0 ? 0.6 : 1 }}>
      {pending ? 'Ставим в очередь…' : `Отправить всем (${count})`}
    </button>
  )
}

// Выбор бота-отправителя + кнопка отправки. Аудитория = подписчики выбранного бота.
export default function CampaignSendControls({ bots }: { bots: Bot[] }) {
  const [botId, setBotId] = useState<number | ''>(bots[0]?.id ?? '')
  const count = bots.find(b => b.id === botId)?.count ?? 0

  if (bots.length === 0) {
    return <p style={{ fontSize: 13, color: '#d24a3d' }}>Нет ботов с токеном. Добавьте бота в разделе «Боты».</p>
  }

  return (
    <div>
      <label style={lbl}>Кому отправить (бот)</label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select name="bot_id" value={botId} onChange={e => setBotId(Number(e.target.value))} className="admin-input" style={{ width: 'auto', minWidth: 260 }}>
          {bots.map(b => <option key={b.id} value={b.id}>@{b.username} — {b.count} подписчиков</option>)}
        </select>
        <SubmitBtn count={count} />
      </div>
    </div>
  )
}
