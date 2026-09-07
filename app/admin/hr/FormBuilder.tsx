'use client'

import { useState } from 'react'
import { QUESTION_TYPES, type HrQuestion, type HrQuestionType } from '@/lib/hrStages'

const inp: React.CSSProperties = {
  padding: '9px 12px', background: '#fff', border: '1px solid #d7dce3', borderRadius: 8,
  color: '#1f2329', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
}
const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#5b6470', marginBottom: 6, display: 'block' }

type Q = HrQuestion & { _id: string }
const newKey = () => 'q_' + Math.random().toString(36).slice(2, 8)

interface Props {
  action: (formData: FormData) => void | Promise<void>
  initial?: { title?: string; description?: string; questions?: HrQuestion[]; active?: boolean }
  isEdit?: boolean
  submitLabel: string
}

export default function FormBuilder({ action, initial, isEdit, submitLabel }: Props) {
  const [questions, setQuestions] = useState<Q[]>(
    (initial?.questions ?? []).map(q => ({ ...q, _id: newKey() }))
  )

  const add = () => setQuestions(qs => [...qs, { _id: newKey(), key: newKey(), label: '', type: 'text', required: false }])
  const remove = (id: string) => setQuestions(qs => qs.filter(q => q._id !== id))
  const patch = (id: string, p: Partial<Q>) => setQuestions(qs => qs.map(q => q._id === id ? { ...q, ...p } : q))
  const move = (id: string, dir: -1 | 1) => setQuestions(qs => {
    const i = qs.findIndex(q => q._id === id); const j = i + dir
    if (i < 0 || j < 0 || j >= qs.length) return qs
    const c = [...qs];[c[i], c[j]] = [c[j], c[i]]; return c
  })

  const serialized = JSON.stringify(questions.map(({ _id, options, ...q }) => ({
    ...q,
    options: q.type === 'select' ? (options ?? []) : undefined,
  })))

  return (
    <form action={action} style={{ maxWidth: 720 }}>
      <input type="hidden" name="questions" value={serialized} />

      <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Название вакансии *</label>
          <input name="title" defaultValue={initial?.title} placeholder="Например: Менеджер по продажам" required style={inp} />
        </div>
        <div>
          <label style={lbl}>Описание (покажется на публичной странице формы)</label>
          <textarea name="description" defaultValue={initial?.description} rows={3} placeholder="Кого ищем, условия, требования…" style={{ ...inp, resize: 'vertical' }} />
        </div>
        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: '#3a4250', cursor: 'pointer' }}>
            <input type="checkbox" name="active" defaultChecked={initial?.active !== false} />
            Вакансия активна (форма принимает заявки)
          </label>
        )}
      </div>

      {/* Конструктор вопросов */}
      <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2329' }}>Вопросы формы</div>
            <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>Имя и телефон/контакт спрашиваются всегда. Ниже — дополнительные вопросы.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {questions.map((q, i) => (
            <div key={q._id} style={{ border: '1px solid #e4e7ec', borderRadius: 10, padding: 12, background: '#fafbfc' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
                  <button type="button" onClick={() => move(q._id, -1)} disabled={i === 0} title="Выше" style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#d0d5dd' : '#8a929c', fontSize: 12, lineHeight: 1 }}>▲</button>
                  <button type="button" onClick={() => move(q._id, 1)} disabled={i === questions.length - 1} title="Ниже" style={{ background: 'none', border: 'none', cursor: i === questions.length - 1 ? 'default' : 'pointer', color: i === questions.length - 1 ? '#d0d5dd' : '#8a929c', fontSize: 12, lineHeight: 1 }}>▼</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input value={q.label} onChange={e => patch(q._id, { label: e.target.value })} placeholder={`Вопрос ${i + 1} (например: Опыт работы?)`} style={{ ...inp, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={q.type} onChange={e => patch(q._id, { type: e.target.value as HrQuestionType })} style={{ ...inp, width: 'auto', minWidth: 150 }}>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#5b6470', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!q.required} onChange={e => patch(q._id, { required: e.target.checked })} />
                      Обязательный
                    </label>
                  </div>
                  {q.type === 'select' && (
                    <input
                      value={(q.options ?? []).join(', ')}
                      onChange={e => patch(q._id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Варианты через запятую: Да, Нет, Возможно"
                      style={{ ...inp, marginTop: 8 }}
                    />
                  )}
                </div>
                <button type="button" onClick={() => remove(q._id)} className="admin-btn-danger" style={{ fontSize: 12, flexShrink: 0 }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={add} className="admin-btn-ghost" style={{ marginTop: 12, fontSize: 13 }}>+ Добавить вопрос</button>
      </div>

      <button type="submit" className="admin-btn-primary">{submitLabel}</button>
    </form>
  )
}
