import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ExamClient from './ExamClient'

export default async function ExamPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Обучение</Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 6px' }}>🎓 Финальная аттестация</h1>
      <p style={{ fontSize: 13, color: '#5b6470', marginBottom: 28, lineHeight: 1.6 }}>
        Тест из {16} вопросов по продукту, скрипту и продажам. Набери проходной балл, затем выполни финальный
        звонок-продажу основателю. Так мы убедимся, что ты готов(а) к работе.
      </p>
      <ExamClient />
    </div>
  )
}
