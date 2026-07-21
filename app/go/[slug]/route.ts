import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Короткая ссылка-редирект: /go/<slug> → target_url из таблицы short_links.
// QR печатается на /go/<slug>, а куда он ведёт — меняется в админке.
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabaseAdmin
    .from('short_links')
    .select('target_url')
    .eq('slug', slug)
    .maybeSingle()

  // неизвестный slug — отправляем на главную, а не показываем ошибку
  if (!data?.target_url) {
    return NextResponse.redirect(new URL('/', _req.url), 302)
  }

  // считаем переход (атомарно, best-effort)
  await supabaseAdmin.rpc('increment_link_clicks', { p_slug: slug })

  return NextResponse.redirect(data.target_url, 302)
}
