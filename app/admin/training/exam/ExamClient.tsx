'use client'

import { useState } from 'react'
import { EXAM, PASS_RATIO, FINAL_CALL_PHONE } from './questions'
import { notifyExamResult } from './actions'

export default function ExamClient() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => EXAM.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered = answeredCount === EXAM.length
  const correct = EXAM.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0)
  const pct = Math.round((correct / EXAM.length) * 100)
  const passed = correct / EXAM.length >= PASS_RATIO

  const pick = (qi: number, oi: number) => {
    if (submitted) return
    setAnswers(prev => prev.map((a, i) => (i === qi ? oi : a)))
  }

  const finish = () => {
    if (!allAnswered) return
    setSubmitted(true)
    notifyExamResult(correct, EXAM.length, passed)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    setAnswers(EXAM.map(() => null))
    setSubmitted(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Результат */}
      {submitted && (
        <div style={{
          borderRadius: 14, padding: '22px 24px', marginBottom: 28,
          border: `1px solid ${passed ? '#a8e6c8' : '#f5c2bc'}`,
          background: passed ? '#e7f7ef' : '#fdecea',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: passed ? '#0e6e89' : '#c0392b', marginBottom: 6 }}>
            {passed ? '✅ Тест сдан!' : '❌ Тест не сдан'}
          </div>
          <div style={{ fontSize: 15, color: '#2a2f36', marginBottom: passed ? 16 : 12 }}>
            Правильных ответов: <b>{correct} из {EXAM.length}</b> ({pct}%). Порог — {Math.round(PASS_RATIO * 100)}%.
          </div>
          {passed ? (
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#1f5138', background: '#d8f1e4', border: '1px solid #a8e6c8', borderRadius: 10, padding: '14px 16px' }}>
              <b>Финальный шаг аттестации.</b> Позвони основателю лично и проведи звонок-продажу клуба по скрипту:<br />
              <a href={`tel:${FINAL_CALL_PHONE.replace(/\s/g, '')}`} style={{ fontSize: 18, fontWeight: 800, color: '#0e6e89', textDecoration: 'none' }}>{FINAL_CALL_PHONE}</a><br />
              Пройди весь скрипт: познакомься, выяви потребность, расскажи о клубе под запрос, назови цену и закрой на встречу/оплату. После звонка ты допущен к работе.
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#8a3a32' }}>
              Пересмотри материалы (скрипт, условия, работа с возражениями, встреча и закрытие) и пройди тест заново.
            </div>
          )}
          <button onClick={reset} className="admin-btn-ghost" style={{ marginTop: 16, fontSize: 13 }}>Пройти заново</button>
        </div>
      )}

      {/* Прогресс */}
      {!submitted && (
        <div style={{ fontSize: 13, color: '#5b6470', marginBottom: 20 }}>
          Отвечено <b style={{ color: '#127a98' }}>{answeredCount}</b> из {EXAM.length}. Выбери по одному ответу в каждом вопросе.
        </div>
      )}

      {/* Вопросы */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {EXAM.map((q, qi) => (
          <div key={qi} className="admin-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
              <span style={{ color: '#8a929c' }}>{qi + 1}.</span> {q.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi
                const isCorrect = oi === q.correct
                let bg = '#fff', border = '#e4e7ec', color = '#2a2f36'
                if (submitted) {
                  if (isCorrect) { bg = '#e7f7ef'; border = '#a8e6c8'; color = '#1f5138' }
                  else if (chosen) { bg = '#fdecea'; border = '#f5c2bc'; color = '#8a3a32' }
                } else if (chosen) { bg = '#eef8fc'; border = '#1EAAD1'; color = '#1f2329' }
                return (
                  <button key={oi} type="button" onClick={() => pick(qi, oi)} disabled={submitted}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: `1px solid ${border}`,
                      background: bg, color, fontSize: 14, cursor: submitted ? 'default' : 'pointer',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .12s',
                    }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${chosen || (submitted && isCorrect) ? (submitted ? (isCorrect ? '#127a98' : '#d24a3d') : '#1EAAD1') : '#cbd2da'}`,
                      background: (chosen && !submitted) ? '#1EAAD1' : (submitted && isCorrect) ? '#127a98' : (submitted && chosen) ? '#d24a3d' : '#fff',
                    }} />
                    {opt}
                    {submitted && isCorrect && <span style={{ marginLeft: 'auto', color: '#127a98', fontWeight: 700 }}>✓</span>}
                    {submitted && chosen && !isCorrect && <span style={{ marginLeft: 'auto', color: '#d24a3d', fontWeight: 700 }}>✕</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button onClick={finish} disabled={!allAnswered} className="admin-btn-primary"
          style={{ marginTop: 24, padding: '13px 32px', fontSize: 14, opacity: allAnswered ? 1 : 0.5, cursor: allAnswered ? 'pointer' : 'not-allowed' }}>
          Завершить тест
        </button>
      )}
    </div>
  )
}
