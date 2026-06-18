import Link from 'next/link'
import TuranLogo from '@/components/TuranLogo'

const C = '#1EAAD1'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: '#080610',
      padding: '60px 32px 36px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48, marginBottom: 52,
        }}>
          <div>
            <div style={{ marginBottom: 16 }}><TuranLogo size={22} tone="light" /></div>
            <p style={{ color: '#7a7790', fontSize: 14, lineHeight: 1.8, maxWidth: 260 }}>
              Бухгалтерский аутсорсинг и сопровождение бизнеса под ключ в Ташкенте.
            </p>
            <p style={{ color: C, fontSize: 13, marginTop: 14, fontWeight: 600 }}>
              От старта до стабильности
            </p>
          </div>

          <div>
            <div style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>Услуги</div>
            {[
              ['/#services', 'Бухучёт под ключ'],
              ['/#services', 'Аудит'],
              ['/#services', 'Регистрация бизнеса'],
              ['/#services', 'ВЭД-операции'],
            ].map(([href, label], i) => (
              <Link key={i} href={href} style={{ display: 'block', color: '#7a7790', fontSize: 14, marginBottom: 10, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>

          <div>
            <div style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>Навигация</div>
            {[
              ['/#industries', 'Кому подходит'],
              ['/#why', 'Почему мы'],
              ['/news', 'Статьи'],
              ['/#contacts', 'Контакты'],
            ].map(([href, label], i) => (
              <Link key={i} href={href} style={{ display: 'block', color: '#7a7790', fontSize: 14, marginBottom: 10, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>

          <div>
            <div style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>Контакты</div>
            <div style={{ color: '#9b98ad', fontSize: 14, lineHeight: 2 }}>
              <a href="tel:+998974314000" style={{ color: '#9b98ad', textDecoration: 'none', display: 'block' }}>+998 97 431-40-00</a>
              <a href="mailto:salesturanbuh@gmail.com" style={{ color: '#9b98ad', textDecoration: 'none', display: 'block' }}>salesturanbuh@gmail.com</a>
              <div style={{ marginTop: 4 }}>Ташкент, Чиланзар, Ц&nbsp;квартал, 7/1</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[['Instagram', 'https://instagram.com/turanos.uz'], ['Telegram', 'https://t.me/turanosbuh'], ['Facebook', 'https://facebook.com/oooturanos']].map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noopener noreferrer" style={{ background: '#171327', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: C, textDecoration: 'none', fontSize: 12.5, fontWeight: 600 }}>{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ color: '#4b4860', fontSize: 13 }}>© 2026 TURAN OS. Все права защищены.</span>
          <Link href="/privacy" style={{ color: '#4b4860', fontSize: 13, textDecoration: 'none' }}>Политика конфиденциальности</Link>
        </div>
      </div>
    </footer>
  )
}
