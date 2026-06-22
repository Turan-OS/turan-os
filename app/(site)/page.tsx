import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { News } from '@/lib/supabase'
import ApplyButton from '@/components/ApplyButton'
import CostCalculator from '@/components/CostCalculator'
import { slugifyShort } from '@/lib/slug'

// ── Фирменные цвета (брендбук TURAN OS v1.07) ──────────────
const C = '#1EAAD1'              // голубой акцент
const D = '#291A42'              // тёмный индиго
const INK = '#0E0A1C'           // фон
const cr = (a: number) => `rgba(30,170,209,${a})`

// ── Контент ────────────────────────────────────────────────
const services = [
  { t: 'Бухучёт под ключ', d: 'Постановка и ведение учёта с нуля: первичка, отчётность, налоги и взносы — полностью на нас.', big: true, icon: <><path d="M5 3h11l3 3v15H5z"/><path d="M15 3v4h4"/><path d="M8.5 12h7M8.5 16h5"/></> },
  { t: 'Аудит', d: 'Независимая проверка, поиск ошибок и оценка налоговых рисков.', icon: <><circle cx="11" cy="11" r="7"/><path d="M16 16l4.5 4.5"/></> },
  { t: 'Разовые услуги', d: 'Закрыть период, навести порядок, сдать конкретный отчёт.', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></> },
  { t: 'Регистрация бизнеса', d: 'Открытие компании под ключ — для местных и иностранных учредителей.', big: true, icon: <><path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/></> },
  { t: 'ВЭД-операции', d: 'Импорт/экспорт, контракты, валютный контроль.', icon: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></> },
  { t: 'Кадры и споры', d: 'Кадровое делопроизводство, выплаты, ответы на требования налоговых.', icon: <><circle cx="9" cy="8" r="3.4"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M21 20a5.5 5.5 0 0 0-3.8-5.2"/></> },
]

const industries = ['Стартапы', 'IT-компании', 'HoReCa', 'Маркетплейсы', 'E-commerce', 'Импорт / Экспорт', 'Ритейл', 'Производство', 'Торговля', 'Клиники', 'Образование (НОУ)', 'Арендодатели']

const advantages = [
  { t: 'Команда экспертов', d: 'Бухгалтеры, аудиторы и юристы с большим практическим опытом в разных сферах бизнеса.' },
  { t: 'Без проблем с проверками', d: 'Гарантируем выполнение всех обязательств — никаких вопросов от надзорных органов.' },
  { t: 'Законная экономия на налогах', d: 'Легально и безопасно снижаем налоговую нагрузку и оптимизируем процессы.' },
  { t: 'Прозрачность', d: 'Точные, понятные отчёты и честные принципы работы — вы всегда знаете состояние дел.' },
  { t: 'Многолетний опыт', d: 'Доверие клиентов — от стартапов до международных компаний и ассоциаций.' },
  { t: 'Гибкие тарифы', d: 'Готовый тариф под ваш масштаб или отдельные услуги по необходимости.' },
]

const steps = [
  { t: 'Заявка', d: 'Оставляете заявку — менеджер связывается и уточняет задачи бизнеса.' },
  { t: 'Аудит и расчёт', d: 'Оцениваем объём учёта и рассчитываем индивидуальную стоимость.' },
  { t: 'Договор и онбординг', d: 'Заключаем договор, принимаем дела и настраиваем процессы.' },
  { t: 'Ведение и отчётность', d: 'Ведём учёт, считаем и платим налоги, сдаём отчётность в срок.' },
]

const team = [
  { n: 'Шахзод Сайдахматов', r: 'Директор', photo: '/images/saidahmatov.webp' },
  { n: 'Холмурод Орипов', r: 'Аудитор', photo: '/images/oripov.webp' },
  { n: 'Шухрат Исламов', r: 'Юрист-консультант', photo: '/images/islamov.webp' },
  { n: 'Саидакбар Саидов', r: 'Бухгалтер', photo: '/images/saidov.webp' },
]

const reviews = [
  { n: 'Азизов Илхом Шодибоевич', r: 'Директор УЦ «Алмаз»', t: 'Высокое качество и дружелюбное отношение в бухгалтерской службе. Рекомендуем.' },
  { n: 'Хао Цзяньфэн', r: 'China Railway Electrification', t: 'Надёжная и профессиональная компания. Специалисты обладают высоким уровнем компетенции.' },
  { n: 'Исмоилов Хусниддин', r: 'Ассоциация экспортёров Узбекистана', t: 'Квалифицированные специалисты, предоставляют действительно качественные услуги.' },
  { n: 'Брайан Джойс', r: 'Access English Resources', t: 'Очень довольны их профессионализмом и поддержкой на каждом этапе.' },
]

const faq = [
  { q: 'Почему стоит выбрать TURAN OS?', a: 'Многолетний опыт, квалифицированные специалисты, гарантия выполнения обязательств, защита интересов клиента и полный спектр услуг под ключ.' },
  { q: 'Какие компании вы обслуживаете?', a: 'Стартапы, IT, HoReCa, e-commerce и маркетплейсы, производство, торговлю, клиники, образовательные центры и другие виды бизнеса.' },
  { q: 'Как формируется стоимость?', a: 'Индивидуально — на основе числа сотрудников, документооборота, банковских операций, наличия касс, НДС и сложности учёта. Точную цену рассчитаем после короткого аудита.' },
  { q: 'Можно ли заказать отдельные услуги?', a: 'Да. Доступны готовые тарифные планы или отдельные услуги (разовый отчёт, аудит, регистрация) по необходимости.' },
  { q: 'Вы работаете с иностранными компаниями?', a: 'Да, помогаем с регистрацией и сопровождением бизнеса для иностранных учредителей, ведём ВЭД-операции и валютный контроль.' },
]

const clients = ['China Railway Electrification', 'Ассоциация экспортёров Узбекистана', 'УЦ «Алмаз»', 'Access English Resources']

const partners = [
  { logo: '/images/tpp.webp', alt: 'Торгово-промышленная палата Узбекистана', text: 'Компания «TURAN OS» является членом Торгово-промышленной палаты Республики Узбекистан, которая была создана в целях формирования благоприятных условий для развития предпринимательства и совершенствования деловой среды.' },
  { logo: '/images/eks.webp', alt: 'Ассоциация экспортёров Узбекистана', text: 'Компания «TURAN OS» заключила меморандум с Ассоциацией Экспортёров и Ассоциацией предпринимателей Республики Узбекистан. Это позволяет нам развивать бизнес, расширять деловые контакты и отношения с иностранными партнёрами.' },
]

const certs = ['/images/sertificate.webp', '/images/682dc56baf683.webp', '/images/682dc557719ff.webp', '/images/682dc55bed255.webp', '/images/682dc56166b43.webp']

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export const revalidate = 120

export default async function Home() {
  const { data } = await supabase
    .from('news')
    .select('id, title, description, date, image_url, published')
    .order('date', { ascending: false })
    .limit(3)
  const articles: News[] = (data ?? []).filter(n => n.published !== false)

  return (
    <>
      {/* ════════ HERO — два столбца + дашборд ════════ */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1100px 600px at 15% 0%, ${D} 0%, ${INK} 70%)` }} />
        <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: 720, height: 720, borderRadius: '50%', background: `radial-gradient(circle, ${cr(0.16)} 0%, transparent 62%)`, pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.45, backgroundImage: `radial-gradient(${cr(0.12)} 1px, transparent 1px)`, backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 65%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 65%)' }} />

        <div className="hero-grid" style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: 'clamp(56px,7vh,104px) clamp(32px,6vw,72px)', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 'clamp(36px,5vw,72px)', alignItems: 'center' }}>
          {/* левая колонка */}
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: cr(0.1), border: `1px solid ${cr(0.28)}`, borderRadius: 100, padding: '7px 16px', color: C, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C }} />
              Бухгалтерский аутсорсинг · Ташкент
            </span>
            <h1 className="hero-title" style={{ fontSize: 'clamp(32px,5vw,62px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 24, fontWeight: 800 }}>
              <span style={{ color: '#fff' }}>Бухгалтерия и налоги</span><br />
              <span style={{ color: '#fff' }}>под </span><span style={{ color: C }}>контролем</span><span style={{ color: '#fff' }}>, бизнес — в&nbsp;росте</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px,1.4vw,18px)', color: 'rgba(255,255,255,0.6)', maxWidth: 520, lineHeight: 1.7, marginBottom: 12 }}>
              Регистрация, учёт, отчётность и сопровождение. Команда экспертов берёт рутину
              и налоговые риски на себя — вы спокойно растёте.
            </p>
            <p style={{ color: C, fontWeight: 600, fontSize: 'clamp(14px,1.3vw,16px)', marginBottom: 34 }}>От старта до стабильности — вместе с TURAN OS</p>
            <div className="hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <ApplyButton variant="section" label="Оставить заявку" />
              <a href="#calc" className="apply-ghost" style={{ padding: '15px 30px', fontSize: 15, textDecoration: 'none' }}>Рассчитать стоимость</a>
            </div>
          </div>

          {/* правая колонка — мок «панели TURAN OS» */}
          <div className="hero-panel" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-8% -6%', borderRadius: 28, background: `linear-gradient(160deg, ${cr(0.18)}, transparent 60%)`, filter: 'blur(8px)' }} />
            <div style={{ position: 'relative', borderRadius: 22, background: 'linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '24px 24px 26px', boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>ПАНЕЛЬ · 2-Й КВАРТАЛ</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#3ad29a', fontSize: 12, fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ad29a' }} />в норме
                </span>
              </div>
              {/* прогресс отчётности */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
                <Ring pct={100} />
                <div>
                  <p style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Отчётность сдана</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>в срок, без штрафов</p>
                </div>
              </div>
              {/* чеклист */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {[['НДС', 'рассчитан'], ['Зарплата и взносы', 'начислены'], ['Налог на прибыль', 'оплачен']].map(([a, b]) => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: cr(0.16), color: C, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10"/></svg>
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: 600, flex: 1 }}>{a}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>{b}</span>
                  </div>
                ))}
              </div>
              {/* мини-бар */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 56 }}>
                {[40, 62, 50, 78, 66, 90, 72].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 5, background: i === 5 ? C : 'rgba(255,255,255,0.14)' }} />
                ))}
              </div>
            </div>
            {/* плавающая плашка */}
            <div className="hero-pill" style={{ position: 'absolute', bottom: -22, left: -18, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C}, #1488c4)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>−18%</span>
              <div>
                <p style={{ color: D, fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>налогов законно</p>
                <p style={{ color: '#8a8696', fontSize: 12 }}>после оптимизации</p>
              </div>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '26px clamp(32px,6vw,72px)', display: 'flex', gap: 'clamp(24px,4vw,64px)', flexWrap: 'wrap' }}>
            {[['10+', 'лет на рынке'], ['11', 'сфер бизнеса'], ['100%', 'прозрачность'], ['B2B', 'местные и иностранные']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CLIENTS ════════ */}
      <section style={{ padding: '30px 48px', background: D, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'clamp(20px,4vw,52px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Нам доверяют</span>
          {clients.map(c => <span key={c} style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, fontWeight: 600 }}>{c}</span>)}
        </div>
      </section>

      {/* ════════ SERVICES — бенто ════════ */}
      <section id="services" className="msec" style={{ padding: '88px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHead label="Услуги" title="Полный спектр под одной крышей" sub="Берём на себя весь учёт — или отдельные задачи под ваш запрос." />
          <div className="bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: '1fr', gap: 14, marginTop: 48 }}>
            {services.map((s, i) => (
              <div key={s.t} className="svc-card" style={{ position: 'relative', overflow: 'hidden', gridColumn: s.big ? 'span 2' : 'span 1', padding: '28px 26px', borderRadius: 20, background: s.big ? `linear-gradient(150deg, ${cr(0.1)}, rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.02)', border: `1px solid ${s.big ? cr(0.22) : 'rgba(255,255,255,0.07)'}`, transition: 'transform .25s, border-color .25s', display: 'flex', flexDirection: 'column' }}>
                <span aria-hidden style={{ position: 'absolute', top: 14, right: 18, fontSize: 'clamp(40px,4vw,58px)', fontWeight: 800, lineHeight: 1, color: 'transparent', WebkitTextStroke: `1px ${cr(0.22)}`, pointerEvents: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ width: 50, height: 50, borderRadius: 13, background: cr(0.12), border: `1px solid ${cr(0.24)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: s.big ? 20 : 17, marginBottom: 9 }}>{s.t}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CALCULATOR — светлая секция ════════ */}
      <section id="calc" className="msec" style={{ padding: '90px 48px', background: '#F2F1F7', color: D }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 44px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 28, height: 2, background: C }} />
              <p style={{ color: '#127a98', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Калькулятор</p>
              <span style={{ width: 28, height: 2, background: C }} />
            </div>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,44px)', fontWeight: 800, lineHeight: 1.12, color: D }}>Узнайте стоимость за минуту</h2>
            <p style={{ color: '#5f5a72', fontSize: 17, lineHeight: 1.6, marginTop: 14 }}>Подвигайте параметры — покажем ориентир. Точную цену зафиксируем после бесплатного аудита.</p>
          </div>
          <CostCalculator />
        </div>
      </section>

      {/* ════════ INDUSTRIES — бегущая строка ════════ */}
      <section id="industries" className="msec" style={{ padding: '80px 0', background: D, overflow: 'hidden' }}>
        <div style={{ padding: '0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <SectionHead label="Кому подходит" title="Работаем с бизнесом любой сферы" />
          </div>
        </div>
        <div className="marquee" style={{ marginTop: 44, display: 'flex', gap: 14, width: 'max-content', animation: 'marq 38s linear infinite' }}>
          {[...industries, ...industries].map((i, idx) => (
            <span key={idx} style={{ padding: '14px 26px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>{i}</span>
          ))}
        </div>
      </section>

      {/* ════════ WHY — крупные контурные цифры ════════ */}
      <section id="why" className="msec" style={{ padding: '88px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHead label="Почему мы" title="Новый стандарт финансового аутсорсинга" sub="Честность, прозрачность и профессионализм — фундамент, на котором бизнес растёт уверенно." />
          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px 56px', marginTop: 40 }}>
            {advantages.map((a, i) => (
              <div key={a.t} style={{ display: 'flex', gap: 22, padding: '26px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 'clamp(48px,5vw,76px)', fontWeight: 800, lineHeight: 0.9, color: 'transparent', WebkitTextStroke: `1.5px ${cr(0.5)}`, flexShrink: 0, minWidth: 'clamp(60px,6vw,92px)' }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{a.t}</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, lineHeight: 1.65 }}>{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PROCESS — крупные контурные цифры ════════ */}
      <section id="process" className="msec" style={{ padding: '88px 48px', background: D }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHead label="Как работаем" title="Прозрачный процесс из 4 шагов" center />
          <div className="proc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 52 }}>
            {steps.map((s, i) => (
              <div key={s.t} style={{ position: 'relative', overflow: 'hidden', padding: '26px 26px 30px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span aria-hidden style={{ position: 'absolute', top: -16, right: 4, fontSize: 'clamp(78px,8vw,116px)', fontWeight: 800, lineHeight: 1, color: 'transparent', WebkitTextStroke: `1.5px ${cr(0.4)}`, pointerEvents: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ position: 'relative', zIndex: 1, marginTop: 46 }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.t}{i < steps.length - 1 && <span style={{ color: cr(0.5), fontSize: 13, letterSpacing: 2 }}>&gt;&gt;&gt;</span>}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TEAM ════════ */}
      <section className="msec" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHead label="Команда" title="Эксперты, которым можно доверять" sub="Специалисты с большим практическим опытом — на вашей стороне." />
          <div className="cards-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 48 }}>
            {team.map(m => (
              <div key={m.n} className="team-card" style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '4 / 5', background: '#160f2e' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photo} alt={m.n} className="team-photo" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,10,28,0.94) 4%, rgba(14,10,28,0.4) 36%, transparent 58%)' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 22px' }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 4, lineHeight: 1.2 }}>{m.n}</p>
                  <p style={{ color: C, fontSize: 13.5, fontWeight: 600 }}>{m.r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS — светлая секция ════════ */}
      <section className="msec" style={{ padding: '88px 48px', background: '#F2F1F7', color: D }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ color: '#127a98', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Отзывы</p>
            <h2 style={{ fontSize: 'clamp(26px,3.4vw,42px)', fontWeight: 800, color: D }}>Что говорят клиенты</h2>
          </div>
          <div className="cards-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {reviews.map(r => (
              <div key={r.n} style={{ padding: '30px', borderRadius: 18, background: '#fff', border: '1px solid #e7e4ef', boxShadow: '0 8px 24px rgba(41,26,66,0.05)' }}>
                <div style={{ color: C, fontSize: 32, lineHeight: 0.6, marginBottom: 16, fontWeight: 800 }}>“</div>
                <p style={{ color: '#3b3650', fontSize: 16, lineHeight: 1.7, marginBottom: 22 }}>{r.t}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: cr(0.14), color: '#127a98', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initials(r.n)}</div>
                  <div>
                    <p style={{ color: D, fontWeight: 700, fontSize: 14.5 }}>{r.n}</p>
                    <p style={{ color: '#8a8696', fontSize: 13 }}>{r.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PARTNERS & CERTIFICATES ════════ */}
      <section id="partners" className="msec" style={{ padding: '88px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHead label="Доверие" title="Партнёры и сертификаты" sub="Членство в профильных объединениях и подтверждённая квалификация специалистов." center />

          <div className="cards-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginTop: 48 }}>
            {partners.map(p => (
              <div key={p.alt} style={{ padding: '28px 30px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', height: 92, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.alt} style={{ maxHeight: 56, maxWidth: '85%', width: 'auto', objectFit: 'contain' }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14.5, lineHeight: 1.7, marginTop: 20 }}>{p.text}</p>
              </div>
            ))}
          </div>

          <p style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center', marginTop: 56, marginBottom: 22 }}>Сертификаты и квалификация</p>
          <div className="certs" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
            {certs.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="cert-card" style={{ display: 'block', background: '#fff', borderRadius: 10, padding: 6, border: '1px solid rgba(255,255,255,0.1)', transition: 'transform .25s, border-color .25s' }}>
                <div style={{ aspectRatio: '3 / 4', borderRadius: 6, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Сертификат ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ARTICLES (SEO) ════════ */}
      <section id="articles" className="msec" style={{ padding: '84px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
            <SectionHead label="Полезное" title="Статьи и разборы" noMargin />
            <Link href="/news" style={{ color: C, textDecoration: 'none', fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap' }}>Все статьи →</Link>
          </div>
          {articles.length > 0 ? (
            <div className="cards-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {articles.map(a => (
                <Link key={a.id} href={`/news/${slugifyShort(a.title)}`} className="art-card" style={{ display: 'block', borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'transform .25s, border-color .25s' }}>
                  {a.image_url
                    ? <div style={{ height: 170, backgroundImage: `url(${a.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    : <div style={{ height: 170, background: `linear-gradient(135deg, ${cr(0.25)}, ${D})` }} />}
                  <div style={{ padding: '20px 22px 24px' }}>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 16.5, lineHeight: 1.35, marginBottom: 10 }}>{a.title}</p>
                    {a.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>{a.description.slice(0, 110)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '48px 32px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.14)', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 18 }}>Скоро здесь появятся статьи о налогах, учёте и ведении бизнеса в Узбекистане.</p>
              <Link href="/news" style={{ color: C, textDecoration: 'none', fontWeight: 600 }}>Перейти в раздел статей →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section className="msec" style={{ padding: '84px 48px', background: D }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <SectionHead label="FAQ" title="Частые вопросы" center />
          <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faq.map(f => (
              <details key={f.q} className="faq-item" style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', padding: '4px 24px' }}>
                <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '20px 0', color: '#fff', fontWeight: 600, fontSize: 16.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  {f.q}
                  <span className="faq-plus" style={{ color: C, fontSize: 22, lineHeight: 1, flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, padding: '0 0 22px' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA + CONTACTS ════════ */}
      <section id="contacts" className="msec" style={{ padding: 'clamp(56px,8vh,96px) 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 500px at 80% 100%, ${D} 0%, ${INK} 70%)` }} />
        <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${cr(0.16)} 0%, transparent 64%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="contacts-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'clamp(36px,5vw,72px)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(30px,4.2vw,54px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.02em', marginBottom: 22, color: '#fff' }}>
                Доверьте бухгалтерию <span style={{ color: C }}>профессионалам</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7, marginBottom: 34, maxWidth: 480 }}>
                Оставьте заявку — менеджер перезвонит, ответит на вопросы и рассчитает стоимость под ваш бизнес.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <ApplyButton variant="section" label="Оставить заявку" />
                <a href="tel:+998974314000" className="apply-ghost" style={{ padding: '15px 30px', fontSize: 15, textDecoration: 'none' }}>+998 97 431-40-00</a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { l: 'Телефоны', v: <><a href="tel:+998974314000" style={{ color: '#fff', textDecoration: 'none' }}>+998 97 431-40-00</a><br /><a href="tel:+998712051303" style={{ color: '#fff', textDecoration: 'none' }}>+998 71 205-13-03</a></> },
                { l: 'E-mail', v: <a href="mailto:salesturanbuh@gmail.com" style={{ color: '#fff', textDecoration: 'none' }}>salesturanbuh@gmail.com</a> },
                { l: 'Адрес', v: <>Ташкент, Чиланзар, Ц квартал,<br />ул. Кичик Халка йули, 7/1</> },
              ].map(c => (
                <div key={c.l} style={{ padding: '18px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{c.l}</p>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15.5, lineHeight: 1.55 }}>{c.v}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Instagram', 'https://instagram.com/turanos.uz'], ['Telegram', 'https://t.me/turanosbuh'], ['Facebook', 'https://facebook.com/oooturanos']].map(([l, h]) => (
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '13px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee:hover { animation-play-state: paused; }
        .svc-card:hover { transform: translateY(-4px); border-color: ${cr(0.45)} !important; }
        .art-card:hover { transform: translateY(-4px); border-color: ${cr(0.4)} !important; }
        .team-card .team-photo { transition: transform .5s cubic-bezier(.2,.7,.3,1); will-change: transform; }
        .team-card:hover .team-photo { transform: scale(1.06); }
        .team-card:hover { border-color: ${cr(0.45)} !important; }
        .cert-card:hover { transform: translateY(-4px); border-color: ${cr(0.5)} !important; }
        .faq-item[open] .faq-plus { transform: rotate(45deg); }
        .faq-plus { transition: transform .2s; display:inline-block; }
        summary::-webkit-details-marker { display:none; }
        @media(max-width:980px){
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-panel { max-width: 460px; }
          .bento { grid-template-columns: repeat(2,1fr) !important; }
          .bento .svc-card { grid-column: span 1 !important; }
          .cards-4, .proc-grid { grid-template-columns: repeat(2,1fr) !important; }
          .contacts-grid, .why-grid { grid-template-columns: 1fr !important; }
          .certs { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media(max-width:640px){
          .cards-2, .cards-3, .bento, .cards-4, .proc-grid { grid-template-columns: 1fr !important; }
          .certs { grid-template-columns: repeat(2,1fr) !important; }
          .msec { padding-top: 56px !important; padding-bottom: 56px !important; }
          .hero-pill { left: 0 !important; }
        }
      `}</style>
    </>
  )
}

function Ring({ pct }: { pct: number }) {
  const r = 26, circ = 2 * Math.PI * r
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke="#1EAAD1" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 34 34)" />
      <text x="34" y="38" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">{pct}%</text>
    </svg>
  )
}

function SectionHead({ label, title, sub, center, noMargin }: { label: string; title: string; sub?: string; center?: boolean; noMargin?: boolean }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: sub ? 720 : undefined, margin: center ? '0 auto' : undefined, marginBottom: noMargin ? 0 : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: center ? 'center' : 'flex-start' }}>
        <span style={{ width: 28, height: 2, background: C }} />
        <p style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</p>
      </div>
      <h2 style={{ fontSize: 'clamp(26px,3.6vw,44px)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.01em', color: '#fff' }}>{title}</h2>
      {sub && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, lineHeight: 1.65, marginTop: 16 }}>{sub}</p>}
    </div>
  )
}
