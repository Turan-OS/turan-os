'use client'

import type { ApplicationStatus } from '@/lib/supabase'

interface Props {
  value: ApplicationStatus
  color: string
  statuses: { key: ApplicationStatus; title: string }[]
  action: (fd: FormData) => Promise<void>
}

export default function StatusSelect({ value, color, statuses, action }: Props) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={value}
        onChange={e => e.currentTarget.form?.requestSubmit()}
        style={{
          width: '100%', padding: '9px 12px', fontSize: 14, fontWeight: 600,
          color, background: '#fff', border: `1.5px solid ${color}`, borderRadius: 9,
          outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: `0 0 0 3px ${color}22`,
        }}
      >
        {statuses.map(s => <option key={s.key} value={s.key} style={{ color: '#1f2329' }}>{s.title}</option>)}
      </select>
    </form>
  )
}
