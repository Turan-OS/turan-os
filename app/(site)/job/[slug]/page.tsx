import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import JobForm from './JobForm'
import type { HrForm } from '@/lib/supabase'
import type { Metadata } from 'next'

export const revalidate = 30

async function getForm(slug: string): Promise<HrForm | null> {
  const { data } = await supabaseAdmin.from('hr_forms').select('*').eq('slug', slug).maybeSingle()
  return (data as HrForm) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const form = await getForm(slug)
  if (!form) return {}
  return {
    title: `Вакансия: ${form.title} | TURAN OS`,
    description: form.description || `Откликнуться на вакансию «${form.title}» в TURAN OS.`,
    robots: { index: false, follow: false }, // страницы откликов не индексируем
  }
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getForm(slug)
  if (!form) notFound()

  if (!form.active) {
    return (
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{form.title}</h1>
        <p style={{ color: '#9b98ad', fontSize: 16 }}>Набор на эту вакансию закрыт. Спасибо за интерес!</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ color: '#1EAAD1', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
        Вакансия · TURAN OS
      </div>
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>{form.title}</h1>
      {form.description && (
        <p style={{ color: '#9b98ad', fontSize: 16, lineHeight: 1.65, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{form.description}</p>
      )}
      <JobForm slug={form.slug} questions={form.questions ?? []} />
    </div>
  )
}
