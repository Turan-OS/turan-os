import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ApplyModal from '@/components/ApplyModal'
import YandexMetrika from '@/components/YandexMetrika'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'AccountingService',
  name: 'TURAN OS',
  url: BASE,
  logo: `${BASE}/icon.png`,
  image: `${BASE}/icon.png`,
  description: 'Бухгалтерский и налоговый аутсорсинг под ключ в Ташкенте: ведение учёта, аудит, регистрация бизнеса, ВЭД, кадры.',
  telephone: '+998974314000',
  email: 'salesturanbuh@gmail.com',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'ул. Кичик Халка йули, 7/1, Чиланзар',
    addressLocality: 'Ташкент',
    addressCountry: 'UZ',
  },
  areaServed: { '@type': 'Country', name: 'Узбекистан' },
  sameAs: [
    'https://instagram.com/turanos.uz',
    'https://t.me/turanosbuh',
    'https://facebook.com/oooturanos',
  ],
}

const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TURAN OS',
  url: BASE,
  inLanguage: 'ru',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE}/news?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0E0A1C', color: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />

      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ApplyModal />
      <YandexMetrika />
    </div>
  )
}
