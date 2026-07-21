import { supabaseAdmin } from '@/lib/supabase'
import CopyLink from './CopyLink'
import QrButton from './QrButton'
import { createLink, updateLinkTarget, deleteLink } from './actions'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.turanos.uz'

// склонение: 1 переход, 2 перехода, 5 переходов
function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', background: '#fff', border: '1px solid #d7dce3', borderRadius: 8,
  color: '#1f2329', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

export default async function AdminLinks() {
  const { data } = await supabaseAdmin.from('short_links').select('*').order('created_at', { ascending: false })
  const links = data ?? []

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Короткие ссылки</h1>
        <p style={{ fontSize: 12.5, color: '#5b6470', lineHeight: 1.5 }}>
          QR/ссылку печатаете один раз на <b>{BASE.replace(/^https?:\/\//, '')}/go/…</b>, а куда она ведёт — меняете здесь в любой момент.
        </p>
      </div>

      {/* Создание новой ссылки */}
      <form action={createLink} className="admin-card" style={{ padding: 16, margin: '18px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5b6470', marginBottom: 5 }}>Короткий адрес</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12.5, color: '#8a929c', whiteSpace: 'nowrap' }}>/go/</span>
            <input name="slug" placeholder="jurnal" required style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5b6470', marginBottom: 5 }}>Куда ведёт (целевая ссылка)</div>
          <input name="target_url" placeholder="https://t.me/turanosbuh" required style={{ ...inputStyle, width: '100%' }} />
        </div>
        <button type="submit" className="admin-btn-primary">Создать</button>
      </form>

      {/* Список */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => {
          const shortUrl = `${BASE}/go/${l.slug}`
          return (
            <div key={l.id} className="admin-card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14, color: '#127a98', textDecoration: 'none' }}>
                    /go/{l.slug}
                  </a>
                  <span style={{ fontSize: 11.5, color: '#8a929c' }}>· {l.clicks} {plural(l.clicks, ['переход', 'перехода', 'переходов'])}</span>
                </div>
                <form action={updateLinkTarget.bind(null, l.id)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input name="target_url" defaultValue={l.target_url} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                  <button type="submit" className="admin-btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>Сохранить</button>
                </form>
              </div>
              <QrButton url={shortUrl} slug={l.slug} />
              <CopyLink url={shortUrl} />
              <form action={deleteLink.bind(null, l.id)}>
                <button type="submit" className="admin-btn-danger" style={{ fontSize: 12 }}>Удалить</button>
              </form>
            </div>
          )
        })}
        {!links.length && (
          <div className="admin-card" style={{ textAlign: 'center', padding: '56px 20px', color: '#8a929c', fontSize: 13 }}>
            Пока нет ни одной короткой ссылки. Создайте первую выше — например <b>/go/jurnal</b>.
          </div>
        )}
      </div>
    </div>
  )
}
