'use client'

import { useState, useTransition } from 'react'
import { CONTACT_STATUS_COLOR } from '@/lib/stages'

// слегка осветляем цвет этапа в фон/рамку
function shade(val?: string): [string, string, string] {
  const c = val || '#8a929c'
  return [c, c + '1a', c + '55'] // текст, фон (10%), рамка (33%)
}

interface Props {
  contactId: number
  value?: string | null
  statuses: string[]
  action: (fd: FormData) => Promise<void>
}

export default function ContactStatusSelect({ contactId, value, statuses, action }: Props) {
  const [val, setVal] = useState<string>(value ?? '')
  const [pending, start] = useTransition()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setVal(v)
    const fd = new FormData()
    fd.append('id', String(contactId))
    fd.append('status', v)
    start(() => { action(fd) })
  }

  const [color, bg, border] = val ? shade(CONTACT_STATUS_COLOR[val]) : ['#8a929c', '#fff', '#d7dce3']
  return (
    <select value={val} onChange={onChange} disabled={pending}
      style={{
        fontSize: 12, fontWeight: 600, padding: '5px 8px', borderRadius: 7,
        border: `1px solid ${border}`, background: bg, color,
        outline: 'none', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 170,
        opacity: pending ? 0.6 : 1,
      }}>
      <option value="">— статус</option>
      {statuses.map(s => <option key={s} value={s} style={{ color: '#1f2329' }}>{s}</option>)}
    </select>
  )
}
