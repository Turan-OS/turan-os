import type { Metadata } from 'next'
import LandingView from '../consultation/LandingView'
import { UZ } from '../consultation/dict'

export const metadata: Metadata = {
  title: UZ.metaTitle,
  description: UZ.metaDesc,
  alternates: { canonical: '/konsultatsiya', languages: { ru: '/consultation', uz: '/konsultatsiya' } },
  openGraph: { title: UZ.ogTitle, description: UZ.ogDesc, type: 'website', locale: 'uz', siteName: 'TURAN OS' },
  robots: { index: true, follow: true },
}

export default function ConsultationUz() {
  return <LandingView t={UZ} />
}
