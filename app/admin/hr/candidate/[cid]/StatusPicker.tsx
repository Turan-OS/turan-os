'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HR_STAGES } from '@/lib/hrStages'
import { setCandidateStatus } from '../../actions'

export default function StatusPicker({ id, status: initial }: { id: number; status: string }) {
  const [status, setStatus] = useState(initial)
  const [pending, start] = useTransition()
  const router = useRouter()

  const pick = (key: string) => {
    if (key === status) return
    setStatus(key)
    start(async () => { await setCandidateStatus(id, key); router.refresh() })
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', opacity: pending ? 0.6 : 1 }}>
      {HR_STAGES.map(s => {
        const active = s.key === status
        return (
          <button key={s.key} type="button" onClick={() => pick(s.key)}
            style={{
              fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${active ? s.color : '#d7dce3'}`,
              background: active ? s.color : '#fff',
              color: active ? '#fff' : '#5b6470', transition: 'all 0.12s',
            }}>
            {s.title}
          </button>
        )
      })}
    </div>
  )
}
