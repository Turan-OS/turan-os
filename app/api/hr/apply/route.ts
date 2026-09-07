import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Приём отклика с публичной формы вакансии → кандидат в hr_candidates.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const slug = (body.slug ?? '').toString()
    const name = (body.name ?? '').toString().slice(0, 200)
    const contact = (body.contact ?? '').toString().slice(0, 200)
    const rawAnswers = (body.answers && typeof body.answers === 'object') ? body.answers : {}

    if (!slug || (!name && !contact)) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    }

    const { data: form } = await supabaseAdmin
      .from('hr_forms').select('id, recruiter_id, active, questions').eq('slug', slug).maybeSingle()
    if (!form || form.active === false) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // оставляем только ответы на существующие вопросы формы
    const allowed = new Set((form.questions ?? []).map((q: { key: string }) => q.key))
    const answers: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawAnswers)) {
      if (allowed.has(k)) answers[k] = (v ?? '').toString().slice(0, 3000)
    }

    const { error } = await supabaseAdmin.from('hr_candidates').insert({
      form_id: form.id, recruiter_id: form.recruiter_id ?? null,
      name: name || null, contact: contact || null, answers, status: 'new',
    })
    if (error) {
      console.error('hr apply insert error:', error.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('hr apply route error:', e)
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
