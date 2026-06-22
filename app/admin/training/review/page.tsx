import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Lesson, LessonProgress, User } from '@/lib/supabase'
import { sendTelegramTo } from '@/lib/telegram'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

// уведомить ученика в Telegram (если подключён)
async function notifyStudent(progressId: number, build: (day?: number) => string) {
  const { data: p } = await supabaseAdmin.from('lesson_progress').select('user_id, lesson_id').eq('id', progressId).maybeSingle()
  if (!p) return
  const [{ data: stu }, { data: lesson }] = await Promise.all([
    supabaseAdmin.from('users').select('telegram_chat_id').eq('id', p.user_id).maybeSingle(),
    supabaseAdmin.from('lessons').select('day_number').eq('id', p.lesson_id).maybeSingle(),
  ])
  if (stu?.telegram_chat_id) await sendTelegramTo(stu.telegram_chat_id, build(lesson?.day_number))
}

async function approveHw(id: number) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  await supabaseAdmin.from('lesson_progress').update({
    status: 'approved', reviewed_at: new Date().toISOString(), reviewer_id: me.uid, reviewer_name: me.name, feedback: null,
  }).eq('id', id)
  await notifyStudent(id, (day) => `🎉 <b>День ${day} принят!</b>\n\nКуратор принял твою домашку. Открыт следующий день обучения — заходи: ${SITE}/admin/training`)
  revalidatePath('/admin/training/review'); revalidatePath('/admin/training')
}

async function rejectHw(id: number, formData: FormData) {
  'use server'
  const me = await getCurrentUser()
  if (!me || me.role === 'manager') return
  const feedback = (formData.get('feedback') as string || '').trim() || 'Доработай, пожалуйста.'
  await supabaseAdmin.from('lesson_progress').update({
    status: 'rejected', reviewed_at: new Date().toISOString(), reviewer_id: me.uid, reviewer_name: me.name, feedback,
  }).eq('id', id)
  await notifyStudent(id, (day) => `✏️ <b>День ${day} — на доработку</b>\n\nКомментарий куратора: ${feedback}\n\nПоправь и отправь снова: ${SITE}/admin/training/day/${day}`)
  revalidatePath('/admin/training/review'); revalidatePath('/admin/training')
}

export default async function ReviewPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login')
  if (me.role === 'manager') redirect('/admin/training')

  const { data: pending } = await supabaseAdmin.from('lesson_progress').select('*').eq('status', 'submitted').order('submitted_at')
  const rows = (pending ?? []) as LessonProgress[]

  const { data: lessons } = await supabaseAdmin.from('lessons').select('*')
  const lessonMap = new Map((lessons as Lesson[] ?? []).map(l => [l.id, l]))
  const { data: users } = await supabaseAdmin.from('users').select('id, name')
  const userMap = new Map((users as Pick<User, 'id' | 'name'>[] ?? []).map(u => [u.id, u.name]))

  return (
    <div style={{ maxWidth: 820 }}>
      <Link href="/admin/training" style={{ fontSize: 13, color: '#5b6470', textDecoration: 'none' }}>← Обучение</Link>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '14px 0 4px' }}>Проверка домашек</h1>
      <p style={{ fontSize: 13, color: '#5b6470', marginBottom: 28 }}>
        {rows.length ? `Ждут проверки: ${rows.length}` : 'Новых домашек на проверку нет.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map(p => {
          const lesson = lessonMap.get(p.lesson_id)
          const name = userMap.get(p.user_id) ?? `ID ${p.user_id}`
          return (
            <div key={p.id} className="admin-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{name}</span>
                  <span style={{ fontSize: 13, color: '#8a929c', marginLeft: 10 }}>День {lesson?.day_number} · {lesson?.title}</span>
                </div>
                {p.submitted_at && <span style={{ fontSize: 12, color: '#aab2bd' }}>{new Date(p.submitted_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
              </div>

              {lesson?.homework && (
                <div style={{ fontSize: 12, color: '#8a929c', marginBottom: 8 }}>Задание: {lesson.homework}</div>
              )}

              <div style={{ background: '#f7f8fa', border: '1px solid #eceef1', borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.7, color: '#2a2f36', whiteSpace: 'pre-wrap', marginBottom: p.audio_url ? 10 : 16 }}>
                {p.submission}
              </div>

              {p.audio_url && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#8a929c', marginBottom: 6 }}>🎤 Аудиозапись звонка</div>
                  <audio controls src={p.audio_url} style={{ width: '100%', maxWidth: 420, height: 38 }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <form action={approveHw.bind(null, p.id)}>
                  <button type="submit" className="admin-btn-primary" style={{ fontSize: 13, padding: '9px 22px' }}>✓ Принять · открыть след. день</button>
                </form>
                <form action={rejectHw.bind(null, p.id)} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280 }}>
                  <input name="feedback" placeholder="Комментарий для доработки…" className="admin-input" style={{ flex: 1 }} />
                  <button type="submit" className="admin-btn-danger" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>↩ Вернуть</button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
