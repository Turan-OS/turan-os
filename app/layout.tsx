import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://turan-os.local'),
  title: {
    default: 'TURAN OS — бухгалтерский аутсорсинг в Ташкенте',
    template: '%s | TURAN OS',
  },
  description:
    'Бухгалтерский и налоговый учёт под ключ в Ташкенте: ведение бухгалтерии, аудит, регистрация бизнеса, ВЭД, кадры. Команда экспертов TURAN OS берёт рутину и налоговые риски на себя.',
  keywords: ['бухгалтерский аутсорсинг Ташкент', 'бухгалтерские услуги Узбекистан', 'ведение бухгалтерии Ташкент', 'налоговый учёт Узбекистан', 'регистрация бизнеса Ташкент', 'аудит Ташкент', 'ВЭД Узбекистан', 'TURAN OS'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TURAN OS — бухгалтерский аутсорсинг в Ташкенте',
    description: 'Бухгалтерия, налоги, аудит и регистрация бизнеса под ключ. От старта до стабильности — вместе с TURAN OS.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://turan-os.local',
    siteName: 'TURAN OS',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'TURAN OS — бухгалтерский аутсорсинг', description: 'Бухгалтерия, налоги, аудит и регистрация бизнеса под ключ в Ташкенте.' },
  robots: { index: true, follow: true },
}

// Минимальный root layout — только html/body
// Header/Footer подключены в (site)/layout.tsx
// Admin имеет свой layout без Header/Footer
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
