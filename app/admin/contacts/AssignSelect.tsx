'use client'

import { useState, useTransition } from 'react'

interface Props {
  contactId: number
  value: number | null | undefined
  users: { id: number; name: string }[]
  action: (fd: FormData) => Promise<void>
}

export default function AssignSelect({ contactId, value, users, action }: Props) {
  const [val, setVal] = useState<string>(value != null ? String(value) : '')
  const [pending, start] = useTransition()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setVal(v) // контролируемо — не откатывается
    const fd = new FormData()
    fd.append('id', String(contactId))
    fd.append('responsible_id', v)
    start(() => { action(fd) })
  }

  const assigned = !!val
  return (
    <select
      value={val}
      onChange={onChange}
      disabled={pending}
      style={{
        fontSize: 12, padding: '5px 8px', borderRadius: 7,
        border: `1px solid ${assigned ? '#bfe9d2' : '#d7dce3'}`,
        background: assigned ? 'rgba(30,170,209,0.06)' : '#fff',
        color: assigned ? '#1f2329' : '#8a929c',
        outline: 'none', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 150,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <option value="">— не назначен</option>
      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select>
  )
}
