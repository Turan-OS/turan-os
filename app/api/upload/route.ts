import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const store = await cookies()
    const session = await verifySession(store.get(SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })

    const folder = (form.get('folder') as string || 'uploads').replace(/[^a-z0-9_-]/gi, '')

    // менеджеры могут грузить только домашки (аудио/файлы), не контент сайта
    if (session.role === 'manager' && folder !== 'homework') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const isHomework = folder === 'homework'
    const okType = isHomework
      ? (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type === 'application/pdf')
      : file.type.startsWith('image/')
    if (!okType) return NextResponse.json({ error: isHomework ? 'Допустимы аудио, изображения, PDF' : 'Только изображения' }, { status: 400 })
    const limit = isHomework ? 25 : 8
    if (file.size > limit * 1024 * 1024) return NextResponse.json({ error: `Файл больше ${limit} МБ` }, { status: 400 })
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())

    const { error } = await supabaseAdmin.storage.from('photos').upload(path, buf, { contentType: file.type, upsert: false })
    if (error) {
      console.error('upload error:', error.message)
      return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from('photos').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e) {
    console.error('upload route error:', e)
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
