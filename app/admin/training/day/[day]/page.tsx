import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { buildCourse, embedUrl, STATE_LABEL, STATE_COLOR } from '@/lib/training'
import { mdToHtml } from '@/lib/markdown'
import { notifyTelegram } from '@/lib/telegram'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import type { Lesson, LessonProgress, Material } from '@/lib/supabase'
import HomeworkForm from '../../HomeworkForm'
import CopyMessages from '../../CopyMessages'

function MaterialCards({ items }: { items: Material[] }) {
  if (!items?.length) return null
  const icon = (t: Material['type']) => (t === 'doc' ? '📄' : t === 'file' ? '📎' : '🔗')
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a929c', marginBottom: 10 }}>Материалы дня</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
        {items.map((m, i) => {
          const href = m.type === 'doc' ? `/admin/training/doc/${m.slug}` : (m.url || '#')
          const external = m.type !== 'doc'
          return (
            <a key={i} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: '#fff', border: '1px solid #e4e7ec', borderRadius: 10, textDecoration: 'none', color: '#1f2329' }} className="mat-card">
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon(m.type)}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{m.title}</span>
              <span style={{ fontSize: 13, color: '#aab2bd', flexShrink: 0 }}>{external ? '↗' : '→'}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

async function submitHomework(formData: FormData) {
  'use server'
  const me = await getCurrentUser()
  if (!me) return
  const lessonId = Number(formData.get('lesson_id'))
  const submission = (formData.get('submission') as string || '').trim()
  const audioUrl = (formData.get('audio_url') as string || '').trim() || null
  if (!lessonId || !submission) return

  // проверка доступа: день должен быть открыт ученику
  const { data: lessons } = await supabaseAdmin.from('lessons').select('*').eq('published', true).order('day_number')
  const { data: progress } = await supabaseAdmin.from('lesson_progress').select('*').eq('user_id', me.uid)
  const course = buildCourse((lessons ?? []) as Lesson[], (progress ?? []) as LessonProgress[])
  const target = course.find(v => v.lesson.id === lessonId)
  if (!target || target.state === 'locked' || target.state === 'approved') return

  await supabaseAdmin.from('lesson_progress').upsert({
    user_id: me.uid, lesson_id: lessonId,
    status: 'submitted', submission, audio_url: audioUrl,
    submitted_at: new Date().toISOString(),
    feedback: null, reviewed_at: null, reviewer_id: null, reviewer_name: null,
  }, { onConflict: 'user_id,lesson_id' })

  notifyTelegram(`📚 <b>Новая домашка на проверку</b>\nУченик: ${me.name}\nДень ${target.lesson.day_number}: ${target.lesson.title}`).catch(() => {})
  revalidatePath('/admin/training')
  revalidatePath(`/admin/training/day/${target.lesson.day_number}`)
  redirect(`/admin/training/day/${target.lesson.day_number}`)
}

export default async function DayPage({ params, searchParams }: { params: Promise<{ day: string }>; searchParams: Promise<{ as?: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  const dayNum = Number((await params).day)
  const isManager = me.role === 'manager'
  // админ/администратор может открыть страницу глазами менеджера: ?as=manager
  const previewAsManager = !isManager && (await searchParams).as === 'manager'
  const asManager = isManager || previewAsManager

  const { data: lesson } = await supabaseAdmin.from('lessons').select('*').eq('day_number', dayNum).eq('published', true).maybeSingle()
  if (!lesson) notFound()

  let state: ReturnType<typeof buildCourse>[number]['state'] = 'available'
  let progress: LessonProgress | undefined

  if (isManager) {
    const { data: lessons } = await supabaseAdmin.from('lessons').select('*').eq('published', true).order('day_number')
    const { data: prog } = await supabaseAdmin.from('lesson_progress').select('*').eq('user_id', me.uid)
    const course = buildCourse((lessons ?? []) as Lesson[], (prog ?? []) as LessonProgress[])
    const view = course.find(v => v.lesson.id === lesson.id)
    if (!view || view.state === 'locked') redirect('/admin/training')
    state = view!.state
    progress = view!.progress
  }

  const video = embedUrl(lesson.video_url)
  const canSubmit = asManager && (state === 'available' || state === 'rejected')

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← К списку дней</Link>
        {!isManager && (
          previewAsManager
            ? <Link href={`/admin/training/day/${lesson.day_number}`} style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>Выйти из предпросмотра ✕</Link>
            : <Link href={`/admin/training/day/${lesson.day_number}?as=manager`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>👁 Глазами менеджера</Link>
        )}
      </div>

      {previewAsManager && (
        <div style={{ marginTop: 12, background: '#fff7e6', border: '1px solid #ffe0a3', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#8a6400', display: 'flex', alignItems: 'center', gap: 8 }}>
          👁 <span>Предпросмотр глазами менеджера. Так эту страницу видит ученик. Отправка домашки здесь отключена.</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 6px' }}>
        <span style={{ fontSize: 11, color: '#8a929c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>День {lesson.day_number}</span>
        {asManager && <span style={{ fontSize: 12, fontWeight: 600, color: STATE_COLOR[state] }}>{STATE_LABEL[state]}</span>}
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{lesson.title}</h1>

      <MaterialCards items={(lesson.materials ?? []) as Material[]} />

      {video && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: 28, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          <iframe src={video} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      )}

      {lesson.content && (
        <div className="lesson-prose" style={{ marginBottom: 32 }}
          dangerouslySetInnerHTML={{ __html: mdToHtml(lesson.content) }} />
      )}
      <CopyMessages />{/* включает кнопки «Скопировать» в блоках :::msg внутри материала */}

      {lesson.homework && (
        <div style={{ background: '#f4f6f8', border: '1px solid #e4e7ec', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#127a98', marginBottom: 8 }}>Домашнее задание</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#2a2f36', whiteSpace: 'pre-wrap' }}>{lesson.homework}</div>
        </div>
      )}

      {/* Состояние домашки для ученика */}
      {asManager && state === 'submitted' && (
        <div style={{ background: '#fff7e6', border: '1px solid #ffe0a3', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#8a6400' }}>
          ⏳ Домашка отправлена и ждёт проверки куратора. Как только её примут — откроется следующий день.
          {progress?.submission && <div style={{ marginTop: 10, color: '#5b6470', whiteSpace: 'pre-wrap', fontSize: 13 }}>{progress.submission}</div>}
          {progress?.audio_url && <div style={{ marginTop: 10 }}><audio controls src={progress.audio_url} style={{ height: 36 }} /></div>}
        </div>
      )}

      {asManager && state === 'approved' && (
        <div style={{ background: '#e7f7ef', border: '1px solid #a8e6c8', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#0e6e89' }}>
          ✓ День пройден, домашка принята. Двигайся дальше!
        </div>
      )}

      {asManager && state === 'rejected' && progress?.feedback && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c2bc', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#c0392b', marginBottom: 16 }}>
          ↩️ Куратор вернул на доработку: {progress.feedback}
        </div>
      )}

      {canSubmit && (
        <HomeworkForm lessonId={lesson.id} defaultText={progress?.submission ?? ''} rejected={state === 'rejected'} submit={submitHomework} preview={previewAsManager} />
      )}

      {!asManager && (
        <div style={{ fontSize: 12, color: '#8a929c', marginTop: 16 }}>Это режим админа. Чтобы увидеть страницу глазами ученика — нажми «👁 Глазами менеджера» вверху.</div>
      )}
    </div>
  )
}
