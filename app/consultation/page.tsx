import type { Metadata } from 'next'
import TuranLogo from '@/components/TuranLogo'
import YandexMetrika from '@/components/YandexMetrika'
import ConsultForm from './ConsultForm'

const C = '#1EAAD1'
const INK = '#0E0A1C'

export const metadata: Metadata = {
  title: 'Бесплатная консультация бухгалтера в Ташкенте',
  description: 'Бесплатная консультация по бухгалтерии и налогам в Ташкенте: разберём вашу ситуацию, покажем, где вы переплачиваете, и рассчитаем стоимость ведения под ваш бизнес.',
  alternates: { canonical: '/consultation' },
  openGraph: {
    title: 'Бесплатная консультация бухгалтера — TURAN OS',
    description: 'Разберём вашу бухгалтерию и налоги бесплатно. Покажем, где вы переплачиваете, и как навести порядок.',
    type: 'website', locale: 'ru_RU', siteName: 'TURAN OS',
  },
  robots: { index: true, follow: true },
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: '22px 22px',
}
const eyebrow: React.CSSProperties = { color: C, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px', ...style }}>{children}</section>
}

export default function ConsultationLanding() {
  const pains = [
    'Не знаете точную налоговую нагрузку бизнеса',
    'Отчёты сдаются в последний день или с просрочками',
    'Не уверены, что платите налоги оптимально',
    'Бухгалтер «незаменим» — заболеет, и всё встанет',
    'Боитесь налоговой проверки и доначислений',
    'Первичка и ЭСФ ведутся «как получится»',
  ]
  const gets = [
    { t: 'Разбор вашей ситуации', d: 'Посмотрим, как ведётся учёт сейчас, и найдём слабые места и риски.' },
    { t: 'Где вы переплачиваете', d: 'Покажем точки, где теряются деньги на налогах, и как это исправить законно.' },
    { t: 'Расчёт стоимости', d: 'Посчитаем стоимость ведения бухгалтерии под ваш оборот — прозрачно.' },
    { t: 'План действий', d: 'Даже если не станете клиентом — уйдёте с понятной картиной и следующими шагами.' },
  ]
  const steps = [
    { n: '01', t: 'Оставляете заявку', d: 'Имя и телефон — 1 минута.' },
    { n: '02', t: 'Короткий разговор', d: 'Менеджер уточнит сферу и задачи вашего бизнеса.' },
    { n: '03', t: 'Бесплатная консультация', d: 'Разбор, рекомендации и расчёт стоимости. Без обязательств.' },
  ]

  return (
    <main style={{ background: INK, color: '#fff', minHeight: '100dvh', fontFamily: "'Onest', 'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800;900&display=swap');`}</style>
      <YandexMetrika />

      {/* верхняя полоса: лого + телефон */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <TuranLogo size={22} tone="light" />
          <a href="tel:+998974314000" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>+998 97 431-40-00</a>
        </Section>
      </div>

      {/* HERO */}
      <div style={{ background: 'radial-gradient(1100px 500px at 50% -10%, #291A42 0%, transparent 70%)' }}>
        <Section style={{ padding: '56px 20px 40px', textAlign: 'center' }}>
          <div style={eyebrow}>Бухгалтерский аутсорсинг · Ташкент</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.02em', maxWidth: 760, margin: '0 auto 18px' }}>
            Бесплатная консультация по бухгалтерии и налогам
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 28px' }}>
            Разберём вашу ситуацию, покажем, где вы переплачиваете налоги, и рассчитаем стоимость ведения под ваш бизнес. Без обязательств.
          </p>
          <a href="#form" style={{ display: 'inline-block', background: C, color: '#04222b', fontWeight: 800, fontSize: 17, padding: '16px 40px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 10px 30px rgba(30,170,209,0.35)' }}>
            Получить консультацию
          </a>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            {['Члены ТПП Узбекистана', 'Аудиторы в штате', 'Ответственность по договору'].map(t => (
              <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '7px 16px' }}>✓ {t}</span>
            ))}
          </div>
        </Section>
      </div>

      {/* PAIN */}
      <Section style={{ padding: '48px 20px' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, textAlign: 'center', marginBottom: 28 }}>Узнали себя хотя бы в одном?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {pains.map(p => (
            <div key={p} style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px' }}>
              <span style={{ color: '#e0574a', fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>✕</span>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15.5, marginTop: 24, lineHeight: 1.6 }}>
          Каждый пункт — это риск штрафов и переплат. На бесплатной консультации разберём именно вашу ситуацию.
        </p>
      </Section>

      {/* ЧТО ПОЛУЧИТЕ */}
      <div style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Section style={{ padding: '48px 20px' }}>
          <div style={{ ...eyebrow, textAlign: 'center' }}>Что вы получите</div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, textAlign: 'center', marginBottom: 30 }}>На бесплатной консультации</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {gets.map((g, i) => (
              <div key={g.t} style={card}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(30,170,209,0.14)', border: '1px solid rgba(30,170,209,0.3)', color: C, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{i + 1}</div>
                <div style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6 }}>{g.t}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{g.d}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* КАК ПРОХОДИТ */}
      <Section style={{ padding: '48px 20px' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, textAlign: 'center', marginBottom: 30 }}>Как это работает</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {steps.map(s => (
            <div key={s.n} style={card}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'rgba(30,170,209,0.25)', lineHeight: 1, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ФОРМА */}
      <div style={{ background: 'linear-gradient(180deg, rgba(41,26,66,0.5) 0%, transparent 100%)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Section style={{ padding: '52px 20px 64px', maxWidth: 520 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, textAlign: 'center', lineHeight: 1.2, marginBottom: 10 }}>Оставьте заявку</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
            Менеджер свяжется с вами, разберёт ситуацию и рассчитает стоимость. Бесплатно и без обязательств.
          </p>
          <ConsultForm id="form" />
          <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Или позвоните: <a href="tel:+998974314000" style={{ color: C, textDecoration: 'none', fontWeight: 600 }}>+998 97 431-40-00</a>
          </div>
        </Section>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12.5, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#6b6388' }}>TURAN OS · Бухгалтерский аутсорсинг в Ташкенте</div>
      </footer>
    </main>
  )
}
