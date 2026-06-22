import ApplyButton from '@/components/ApplyButton'

// Единый блок призыва к действию в конце каждой статьи.
// Открывает форму заявки (ApplyModal подключён в (site)/layout.tsx).
export default function ArticleCTA() {
  return (
    <section
      style={{
        marginTop: 56,
        borderRadius: 22,
        padding: '40px 38px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #291A42 0%, #0E0A1C 100%)',
        border: '1px solid rgba(30,170,209,0.25)',
      }}
    >
      {/* мягкое голубое свечение */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: -90, right: -70, width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,170,209,0.28), transparent 70%)', pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ color: '#1EAAD1', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          TURAN OS · бухгалтерский аутсорсинг
        </div>
        <h3 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, lineHeight: 1.2, color: '#fff', marginBottom: 14, letterSpacing: '-0.01em' }}>
          Возьмём вашу бухгалтерию и налоги на себя
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 16, lineHeight: 1.65, maxWidth: 560, marginBottom: 28 }}>
          Ведение учёта, отчётность в срок, оптимизация налогов и спокойствие с проверками.
          Оставьте заявку — менеджер бесплатно проконсультирует и рассчитает стоимость под ваш бизнес.
        </p>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <ApplyButton variant="section" label="Оставить заявку" />
          <a
            href="tel:+998974314000"
            style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            +998 97 431-40-00
          </a>
        </div>
      </div>
    </section>
  )
}
