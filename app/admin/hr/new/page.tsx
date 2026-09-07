import Link from 'next/link'
import FormBuilder from '../FormBuilder'
import { createForm } from '../actions'
import type { HrQuestion } from '@/lib/hrStages'

// пара вопросов-примеров, чтобы было понятно с чего начать
const SAMPLE: HrQuestion[] = [
  { key: 'q_exp', label: 'Опыт работы (лет, где)', type: 'textarea', required: false },
  { key: 'q_salary', label: 'Ожидания по зарплате', type: 'text', required: false },
]

export default function NewVacancy() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/hr" style={{ fontSize: 13, color: '#127a98', textDecoration: 'none' }}>← Все вакансии</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>Новая вакансия</h1>
      </div>
      <FormBuilder action={createForm} initial={{ questions: SAMPLE }} submitLabel="Создать вакансию" />
    </div>
  )
}
