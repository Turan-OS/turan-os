import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { buildCourse, STATE_LABEL, STATE_COLOR } from '@/lib/training'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Lesson, LessonProgress } from '@/lib/supabase'
import { delLesson } from './lesson/actions'

// ───────────────────────── page ─────────────────────────
export default async function TrainingPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') return <StudentCourse userId={me.uid} />
  return <AdminHub />
}

// ───────────────────────── ученик ─────────────────────────
async function StudentCourse({ userId }: { userId: number }) {
  const { data: lessons } = await supabaseAdmin.from('lessons').select('*').eq('published', true).order('day_number')
  const { data: progress } = await supabaseAdmin.from('lesson_progress').select('*').eq('user_id', userId)
  const course = buildCourse((lessons ?? []) as Lesson[], (progress ?? []) as LessonProgress[])
  const done = course.filter(v => v.state === 'approved').length

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Обучение менеджера</h1>
      <p style={{ fontSize: 13, color: '#5b6470', marginBottom: 28 }}>
        Проходи дни по порядку. Следующий день открывается после того, как куратор примет твою домашку.
        {course.length > 0 && <> · Пройдено <b style={{ color: '#127a98' }}>{done}</b> из {course.length}</>}
      </p>

      <Link href="/admin/training/doc/career-ladder" style={{ textDecoration: 'none', display: 'block', marginBottom: 22 }}>
        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderColor: '#bfe9d2', background: 'linear-gradient(90deg, #f4faf6, #ffffff)' }}>
          <span style={{ fontSize: 22 }}>📈</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1f2329' }}>Карьерная лестница и доход</div>
            <div style={{ fontSize: 12.5, color: '#8a929c', marginTop: 2 }}>Ступени роста, оклады, проценты и примеры заработка — твой путь от стажёра до управляющего.</div>
          </div>
          <span style={{ color: '#127a98', fontSize: 18 }}>→</span>
        </div>
      </Link>

      {course.length === 0 && (
        <div className="admin-card" style={{ padding: '40px 24px', textAlign: 'center', color: '#8a929c', fontSize: 14 }}>
          Уроки скоро появятся.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {course.map(({ lesson, state, progress }) => {
          const open = state !== 'locked'
          const inner = (
            <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: open ? 1 : 0.6 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: open ? '#e7f7ef' : '#eef0f3', color: open ? '#127a98' : '#aab2bd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {state === 'approved' ? '✓' : state === 'locked' ? '🔒' : lesson.day_number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#8a929c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>День {lesson.day_number}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2329' }}>{lesson.title}</div>
                {state === 'rejected' && progress?.feedback && (
                  <div style={{ fontSize: 12, color: '#d24a3d', marginTop: 4 }}>Куратор: {progress.feedback}</div>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: STATE_COLOR[state], whiteSpace: 'nowrap' }}>{STATE_LABEL[state]}</span>
            </div>
          )
          return open
            ? <Link key={lesson.id} href={`/admin/training/day/${lesson.day_number}`} style={{ textDecoration: 'none' }}>{inner}</Link>
            : <div key={lesson.id}>{inner}</div>
        })}
      </div>

      {/* Финальная аттестация */}
      <Link href="/admin/training/exam" style={{ textDecoration: 'none', display: 'block', marginTop: 22 }}>
        <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, borderColor: '#bfe9d2', background: 'linear-gradient(90deg, #f4faf6, #ffffff)' }}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1f2329' }}>Финальная аттестация</div>
            <div style={{ fontSize: 12.5, color: '#8a929c', marginTop: 2 }}>Тест на знание продукта и продаж + финальный звонок-продажа. Пройди, когда освоишь все дни.</div>
          </div>
          <span style={{ color: '#127a98', fontSize: 18 }}>→</span>
        </div>
      </Link>
    </div>
  )
}

// ───────────────────────── админ / куратор ─────────────────────────
async function AdminHub() {
  const { data: lessons } = await supabaseAdmin.from('lessons').select('*').order('day_number')
  const { count: pending } = await supabaseAdmin.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('status', 'submitted')

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Обучение</h1>
          <p style={{ fontSize: 12, color: '#5b6470' }}>{lessons?.length ?? 0} дней в программе</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/training/exam" className="admin-btn-ghost">🎓 Аттестация</Link>
          <Link href="/admin/training/docs" className="admin-btn-ghost">База знаний</Link>
          <Link href="/admin/training/review" className="admin-btn-ghost" style={{ position: 'relative' }}>
            Проверка домашек
            {!!pending && <span style={{ marginLeft: 8, background: '#d24a3d', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{pending}</span>}
          </Link>
          <Link href="/admin/training/lesson/new" className="admin-btn-primary">Добавить день</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lessons?.map(l => (
          <div key={l.id} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e7f7ef', color: '#127a98', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{l.day_number}</div>
            <Link href={`/admin/training/lesson/${l.id}`} title="Открыть для редактирования" style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: '#8a929c', marginTop: 2 }}>
                {l.video_url ? '🎬 видео · ' : ''}{l.homework ? 'есть задание' : 'без задания'}{!l.published ? ' · ⚠️ скрыт' : ''}
              </div>
            </Link>
            {l.published && (
              <Link href={`/admin/training/day/${l.day_number}?as=manager`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} title="Посмотреть глазами менеджера">👁 Просмотр</Link>
            )}
            <form action={delLesson.bind(null, l.id)}>
              <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
            </form>
          </div>
        ))}
        {!lessons?.length && <div className="admin-card" style={{ padding: '40px 24px', textAlign: 'center', color: '#8a929c', fontSize: 14 }}>Дней пока нет — добавь первый.</div>}
      </div>
    </div>
  )
}
