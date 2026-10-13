import type { Metadata } from 'next'
import LandingView from './LandingView'
import { RU } from './dict'

export const metadata: Metadata = {
  title: RU.metaTitle,
  description: RU.metaDesc,
  alternates: { canonical: '/consultation', languages: { ru: '/consultation', uz: '/konsultatsiya' } },
  openGraph: { title: RU.ogTitle, description: RU.ogDesc, type: 'website', locale: 'ru_RU', siteName: 'TURAN OS' },
  robots: { index: true, follow: true },
}

export default function ConsultationRu() {
  return <LandingView t={RU} />
}
