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
    title: l.title ?? 'TURAN OS',
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
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #291A42 0%, #0E0A1C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '24px 16px', boxSizing: 'border-box' }}>
      {pixel && (
        <>
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <noscript><img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`} /></noscript>
        </>
      )}
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,0.45)', border: '1px solid rgba(30,170,209,0.18)' }}>
        {l.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image_url} alt={l.title ?? ''} style={{ width: '100%', height: 'auto', display: 'block' }} />
        )}
        <div style={{ padding: '28px 26px 26px', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {l.title && <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0E0A1C', lineHeight: 1.25, margin: 0, letterSpacing: '-0.01em' }}>{l.title}</h1>}
          {l.description && <p style={{ fontSize: 15, color: '#5b6470', lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-line' }}>{l.description}</p>}

          {l.collect_phone ? (
            <LeadForm slug={l.slug} buttonText={l.button_text || 'Перейти в Telegram'} pixel={!!pixel} contentName={contentName} contentCategory={contentCategory} />
          ) : (
            <CtaButton slug={l.slug} buttonText={l.button_text || 'Перейти в Telegram'} pixel={!!pixel} contentName={contentName} contentCategory={contentCategory} />
          )}
          <div style={{ marginTop: 'auto', paddingTop: 22, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#127a98', textAlign: 'center' }}>TURAN OS</div>
        </div>
      </div>
    </div>
  )
}
