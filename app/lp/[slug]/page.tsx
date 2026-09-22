import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LeadForm from './LeadForm'
import CtaButton from './CtaButton'

export const dynamic = 'force-dynamic'

type Landing = {
  id: number; slug: string; title: string | null; image_url: string | null
  description: string | null; button_text: string | null; button_url: string | null; active: boolean | null
  collect_phone: boolean | null; views: number | null; pixel_id: string | null
}

async function getLanding(slug: string): Promise<Landing | null> {
  const { data } = await supabaseAdmin.from('landings').select('*').eq('slug', slug).maybeSingle()
  return (data as Landing) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const l = await getLanding(slug)
  if (!l) return {}
  return {
    title: l.title ?? 'PRO Business Club',
    description: l.description ?? undefined,
    openGraph: { title: l.title ?? '', description: l.description ?? '', images: l.image_url ? [l.image_url] : [] },
    robots: { index: false, follow: false },
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = await getLanding(slug)
  if (!l || l.active === false) notFound()

  // учёт показа
  await supabaseAdmin.from('landings').update({ views: (l.views ?? 0) + 1 }).eq('id', l.id)

  const pixel = (l.pixel_id || '').replace(/\D/g, '')
  const contentName = l.title || l.slug
  const contentCategory = l.slug

  return (
    <div style={{ minHeight: '100dvh', background: '#0f211a', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {pixel && (
        <>
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <noscript><img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`} /></noscript>
        </>
      )}
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {l.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image_url} alt={l.title ?? ''} style={{ width: '100%', height: 'auto', display: 'block' }} />
        )}
        <div style={{ padding: '26px 24px 32px', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {l.title && <h1 style={{ fontSize: 22, fontWeight: 800, color: '#16241d', lineHeight: 1.25, margin: 0 }}>{l.title}</h1>}
          {l.description && <p style={{ fontSize: 15, color: '#46524b', lineHeight: 1.55, marginTop: 12, whiteSpace: 'pre-line' }}>{l.description}</p>}

          {l.collect_phone ? (
            <LeadForm slug={l.slug} buttonText={l.button_text || 'Перейти в Telegram'} pixel={!!pixel} contentName={contentName} contentCategory={contentCategory} />
          ) : (
            <CtaButton slug={l.slug} buttonText={l.button_text || 'Перейти в Telegram'} pixel={!!pixel} contentName={contentName} contentCategory={contentCategory} />
          )}
          <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 11, color: '#aab2bd', textAlign: 'center' }}>PRO Business Club</div>
        </div>
      </div>
    </div>
  )
}
