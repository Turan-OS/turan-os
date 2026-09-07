import Link from 'next/link'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'
import TuranLogo from '@/components/TuranLogo'
import { getCurrentUser } from '@/lib/currentUser'
import { supabaseAdmin } from '@/lib/supabase'

const ROLE_LABEL: Record<string, string> = { admin: 'Админ', administrator: 'Администратор', manager: 'Менеджер', recruiter: 'Рекрутер' }
const PUBLIC = ['/admin/login', '/admin/register']

// Сколько просроченных задач видно пользователю (для красной плашки в меню)
async function overdueCount(user: { role: string; name: string; uid: number }): Promise<number> {
  const { data } = await supabaseAdmin.from('application_tasks')
    .select('application_id, contact_id, due_date').eq('done', false).not('due_date', 'is', null)
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const overdue = (data ?? []).filter(t => new Date(t.due_date as string).getTime() < startToday.getTime())
  if (user.role !== 'manager') return overdue.length

  // менеджер видит только свои (по ответственному в заявке/контакте)
  const appIds = [...new Set(overdue.map(t => t.application_id).filter(Boolean))] as number[]
  const contactIds = [...new Set(overdue.map(t => t.contact_id).filter(Boolean))] as number[]
  const [{ data: apps }, { data: cts }] = await Promise.all([
    appIds.length ? supabaseAdmin.from('applications').select('id, responsible').in('id', appIds) : Promise.resolve({ data: [] as { id: number; responsible: string | null }[] }),
    contactIds.length ? supabaseAdmin.from('contacts').select('id, responsible_id').in('id', contactIds) : Promise.resolve({ data: [] as { id: number; responsible_id: number | null }[] }),
  ])
  const appResp = new Map((apps ?? []).map(a => [a.id, a.responsible]))
  const ctResp = new Map((cts ?? []).map(c => [c.id, c.responsible_id]))
  return overdue.filter(t =>
    t.application_id ? appResp.get(t.application_id) === user.name
      : t.contact_id ? ctResp.get(t.contact_id) === user.uid
        : false,
  ).length
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname') || ''
  const isPublicPage = PUBLIC.includes(pathname)

  // настоящая проверка подписи сессии (Node, тот же секрет что и при логине)
  const user = await getCurrentUser()
  if (pathname && !isPublicPage && !user) redirect('/admin/login')

  // на странице логина/регистрации — без сайдбара
  if (isPublicPage) return <>{children}</>

  const overdue = user ? await overdueCount({ role: user.role, name: user.name, uid: user.uid }) : 0

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif !important; background: #eef0f3 !important; color: #1f2329 !important; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* ── Боковое меню (тёмный индиго — стиль лендинга) ── */
        .nav-link {
          position: relative; display: flex; align-items: center; gap: 11px;
          padding: 8px 12px; border-radius: 9px;
          color: #9b95b8; text-decoration: none; font-size: 13.5px;
          font-weight: 500; letter-spacing: 0.01em; margin-bottom: 2px;
          transition: color 0.15s, background 0.15s;
        }
        .nav-ico {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; flex-shrink: 0; opacity: 0.8;
          transition: opacity 0.15s, color 0.15s;
        }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-link:hover .nav-ico { opacity: 1; }
        .nav-link-active { color: #1EAAD1; font-weight: 600; background: rgba(30,170,209,0.10); }
        .nav-link-active .nav-ico { opacity: 1; }
        .nav-link-plain { padding-left: 12px; color: #8f88aa; }
        .nav-link-plain:hover { color: #d8d2ec; background: rgba(255,255,255,0.04); }

        /* ── Кнопки ── */
        .admin-btn-primary {
          display: inline-block; background: #1EAAD1; color: #fff;
          padding: 10px 22px; border-radius: 8px; font-weight: 600;
          font-size: 13px; border: none; cursor: pointer;
          text-decoration: none; letter-spacing: 0.01em;
          box-shadow: 0 1px 2px rgba(30,170,209,0.25); transition: background 0.15s;
        }
        .admin-btn-primary:hover { background: #1591b3; }

        .admin-btn-ghost {
          display: inline-block; background: #fff; color: #5b6470;
          padding: 10px 18px; border-radius: 8px; font-weight: 500;
          font-size: 13px; border: 1px solid #d7dce3; cursor: pointer;
          text-decoration: none; transition: border-color 0.15s, color 0.15s;
        }
        .admin-btn-ghost:hover { border-color: #1EAAD1; color: #127a98; }

        .admin-btn-danger {
          display: inline-block; background: #fff; color: #d24a3d;
          padding: 8px 14px; border-radius: 7px; font-weight: 500;
          font-size: 12px; border: 1px solid #f0d2ce; cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .admin-btn-danger:hover { border-color: #d24a3d; background: #fdf2f1; color: #c0392b; }

        /* ── Иконочные действия в карточках (минимал) ── */
        .gcard-act {
          width: 32px; height: 32px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid #e7e9ee; background: #fff;
          color: #98a0aa; cursor: pointer; padding: 0; text-decoration: none;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .gcard-act:hover { color: #3a4250; border-color: #cdd3db; background: #f7f8fa; }
        .gcard-act.is-on { color: #127a98; border-color: #cfe9f3; background: #eef8fc; }
        .gcard-act.is-on:hover { color: #0e6e89; border-color: #a9d6e8; }
        .gcard-act-del:hover { color: #d24a3d; border-color: #f0c9c4; background: #fef2f1; }

        /* ── Поверхности ── */
        .admin-card {
          background: #ffffff; border: 1px solid #e4e7ec; border-radius: 12px;
          box-shadow: 0 1px 3px rgba(16,24,40,0.05);
        }

        .admin-input {
          width: 100%; background: #fff; border: 1px solid #d7dce3;
          border-radius: 8px; padding: 11px 14px; color: #1f2329; font-size: 14px;
          outline: none; font-family: 'Inter', sans-serif; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-input::placeholder { color: #9aa3ad; }
        .admin-input:focus { border-color: #1EAAD1; box-shadow: 0 0 0 3px rgba(30,170,209,0.12); }

        .admin-label {
          display: block; font-size: 11px; font-weight: 600; color: #8a929c;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;
        }

        .admin-row {
          background: #ffffff; border: 1px solid #e4e7ec; border-radius: 10px;
          padding: 18px 22px; display: flex; justify-content: space-between;
          align-items: center; gap: 16px; flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(16,24,40,0.05);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-row:hover { border-color: #bfe2ef; box-shadow: 0 2px 8px rgba(16,24,40,0.08); }

        .tag {
          display: inline-block; background: rgba(30,170,209,0.1);
          color: #127a98; border: 1px solid rgba(30,170,209,0.25);
          border-radius: 4px; padding: 3px 10px; font-size: 11px;
          font-weight: 600; letter-spacing: 0.04em;
        }

        .form-panel {
          background: #ffffff; border: 1px solid #e4e7ec;
          border-radius: 14px; padding: 28px 32px; margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(16,24,40,0.05);
        }
        .form-panel-accent { border-color: rgba(30,170,209,0.35); box-shadow: 0 0 0 3px rgba(30,170,209,0.06); }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        background: '#eef0f3', fontFamily: "'Inter', sans-serif",
      }}>
        {/* Sidebar — тёмный индиго (стиль лендинга) */}
        <aside style={{
          width: 208, background: 'linear-gradient(180deg, #160f2e 0%, #0E0A1C 100%)',
          borderRight: '1px solid #261c42',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '18px 18px 15px', borderBottom: '1px solid #261c42' }}>
            <TuranLogo size={18} tone="light" />
            <div style={{ fontSize: 9.5, color: '#6b6388', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6, fontWeight: 600 }}>
              Панель управления
            </div>
          </div>

          <nav style={{ padding: '12px 9px', flex: 1, overflowY: 'auto' }}>
            <AdminNav role={user?.role} overdue={overdue} />
          </nav>

          <div style={{ padding: '14px 10px', borderTop: '1px solid #261c42' }}>
            {user && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ece9f7' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#1EAAD1', marginTop: 2 }}>{ROLE_LABEL[user.role] ?? user.role}</div>
              </div>
            )}
            <Link href="/" target="_blank" className="nav-link nav-link-plain" style={{ fontSize: 13, color: '#8f88aa' }}>Открыть сайт ↗</Link>
            {/* Выход — только POST, чтобы prefetch/сканеры не сбрасывали сессию */}
            <form action="/api/auth/logout" method="post" style={{ margin: 0 }}>
              <button type="submit" className="nav-link nav-link-plain" style={{ fontSize: 13, color: '#8f88aa', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>Выйти</button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '40px 48px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </>
  )
}
