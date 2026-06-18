'use client'

import { useState } from 'react'
import { mdToHtml } from '@/lib/markdown'
import { isScript, parseScript } from '@/lib/scriptDoc'
import ScriptDoc from '@/app/admin/training/ScriptDoc'

export default function MarkdownField({
  name, defaultValue, rows = 12, placeholder, mono = true,
}: {
  name: string
  defaultValue?: string
  rows?: number
  placeholder?: string
  mono?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div>
      <div className="md-tabs">
        <button type="button" className={`md-tab ${tab === 'edit' ? 'md-tab-on' : ''}`} onClick={() => setTab('edit')}>✏️ Текст</button>
        <button type="button" className={`md-tab ${tab === 'preview' ? 'md-tab-on' : ''}`} onClick={() => setTab('preview')}>👁 Предпросмотр</button>
      </div>

      <textarea
        name={name}
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="admin-input"
        style={{ display: tab === 'edit' ? 'block' : 'none', resize: 'vertical', height: 'auto', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', fontSize: 13, lineHeight: 1.6 }}
      />

      {tab === 'preview' && (
        <div className="md-preview">
          {value.trim()
            ? (isScript(value)
                ? <ScriptDoc data={parseScript(value)} />
                : <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: mdToHtml(value) }} />)
            : <div style={{ color: '#aab2bd', fontSize: 13 }}>Пусто — напиши текст во вкладке «Текст».</div>}
        </div>
      )}
    </div>
  )
}
