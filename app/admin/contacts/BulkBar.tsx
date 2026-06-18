'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  users: { id: number; name: string }[]
  action: (ids: number[], rid: number | null) => Promise<void>
}

export default function BulkBar({ users, action }: Props) {
  const [count, setCount] = useState(0)
  const [rid, setRid] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  const recount = () => setCount(document.querySelectorAll('.contact-check:checked').length)

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e.target as HTMLElement)?.classList?.contains('contact-check')) recount()
    }
    document.addEventListener('change', handler)
    recount()
    return () => document.removeEventListener('change', handler)
  }, [])

  const selectAll = (checked: boolean) => {
    document.querySelectorAll<HTMLInputElement>('.contact-check').forEach(cb => { cb.checked = checked })
    recount()
  }

  const apply = () => {
    const ids = [...document.querySelectorAll<HTMLInputElement>('.contact-check:checked')].map(cb => Number(cb.value))
    if (!ids.length) return
    start(async () => {
      await action(ids, rid ? Number(rid) : null)
      selectAll(false)
      router.refresh()
    })
  }

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px',
      background: count ? '#eaf7f0' : '#f4f6f8', border: `1px solid ${count ? '#bfe9d2' : '#e4e7ec'}`, borderRadius: 10,
      transition: 'background .15s, border-color .15s',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#5b6470', cursor: 'pointer' }}>
        <input type="checkbox" onChange={e => selectAll(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#1EAAD1' }} />
        Выбрать все на странице
      </label>
      <span style={{ fontSize: 13, fontWeight: 600, color: count ? '#127a98' : '#8a929c' }}>Выбрано: {count}</span>
      <span style={{ flex: 1 }} />
      <select value={rid} onChange={e => setRid(e.target.value)} className="admin-input" style={{ maxWidth: 210 }}>
        <option value="">— снять ответственного</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <button onClick={apply} disabled={pending || !count} className="admin-btn-primary" style={{ padding: '9px 18px', opacity: (pending || !count) ? 0.5 : 1 }}>
        {pending ? 'Назначаю…' : 'Назначить выбранным'}
      </button>
    </div>
  )
}
