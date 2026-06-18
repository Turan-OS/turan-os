'use client'

import { useState } from 'react'
import type { Material } from '@/lib/supabase'

const inp: React.CSSProperties = {
  padding: '9px 12px', background: '#fff', border: '1px solid #d7dce3',
  borderRadius: 8, color: '#1f2329', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function MaterialsEditor({ initial, docs }: { initial?: Material[]; docs: { slug: string; title: string }[] }) {
  const [rows, setRows] = useState<Material[]>(initial && initial.length ? initial : [])

  const update = (i: number, patch: Partial<Material>) =>
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const add = (type: Material['type']) => setRows(rs => [...rs, { type, title: '', url: '', slug: '' }])
  const remove = (i: number) => setRows(rs => rs.filter((_, j) => j !== i))

  // в hidden-инпут только валидные строки
  const clean = rows
    .filter(r => r.title.trim() && (r.type === 'doc' ? r.slug : r.url))
    .map(r => r.type === 'doc'
      ? { type: 'doc' as const, title: r.title.trim(), slug: r.slug }
      : { type: r.type, title: r.title.trim(), url: (r.url || '').trim() })

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="admin-label">Материалы дня · карточки</label>
      <input type="hidden" name="materials" value={JSON.stringify(clean)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={r.type} onChange={e => update(i, { type: e.target.value as Material['type'] })} style={{ ...inp, flex: '0 0 130px' }}>
              <option value="link">🔗 Ссылка</option>
              <option value="doc">📄 Документ</option>
              <option value="file">📎 Файл</option>
            </select>
            <input value={r.title} onChange={e => update(i, { title: e.target.value })} placeholder="Название карточки" style={{ ...inp, flex: '1 1 200px' }} />
            {r.type === 'doc'
              ? (
                <select value={r.slug ?? ''} onChange={e => update(i, { slug: e.target.value })} style={{ ...inp, flex: '1 1 220px' }}>
                  <option value="">— выбери документ —</option>
                  {docs.map(d => <option key={d.slug} value={d.slug}>{d.title}</option>)}
                </select>
              )
              : <input value={r.url ?? ''} onChange={e => update(i, { url: e.target.value })} placeholder="https://…" style={{ ...inp, flex: '1 1 220px' }} />
            }
            <button type="button" onClick={() => remove(i)} title="Удалить" style={{ ...inp, flex: '0 0 36px', cursor: 'pointer', color: '#d24a3d', textAlign: 'center', padding: '9px 0' }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => add('link')} className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>+ Ссылка</button>
        <button type="button" onClick={() => add('doc')} className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>+ Документ из Базы знаний</button>
      </div>
      {docs.length === 0 && (
        <div style={{ fontSize: 12, color: '#aab2bd', marginTop: 8 }}>Чтобы добавить документ — сначала создай его в «Базе знаний».</div>
      )}
    </div>
  )
}
