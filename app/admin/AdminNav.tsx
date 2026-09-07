'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/session'

type Item = { href: string; label: string; roles: Role[] }
const ALL: Role[] = ['admin', 'administrator', 'manager']
const CONTENT: Role[] = ['admin', 'administrator']
const HR: Role[] = ['admin', 'recruiter']

// минималистичные иконки (feather-style)
const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const ICONS: Record<string, React.ReactNode> = {
  '/admin':              svg(<><path d="M4 11 12 4l8 7" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-5h4v5" /></>),
  '/admin/applications': svg(<><rect x="3.5" y="4.5" width="4.4" height="15" rx="1.2" /><rect x="9.8" y="4.5" width="4.4" height="10" rx="1.2" /><rect x="16.1" y="4.5" width="4.4" height="13" rx="1.2" /></>),
  '/admin/tasks':        svg(<><circle cx="12" cy="12" r="8.5" /><path d="M8.4 12.4l2.5 2.5 4.7-5.2" /></>),
  '/admin/contacts':     svg(<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" /><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" /></>),
  '/admin/training':     svg(<><path d="M12 4 3 8.5l9 4.5 9-4.5z" /><path d="M7 11v4.3c0 1.1 2.24 2 5 2s5-.9 5-2V11" /><path d="M21 8.5V14" /></>),
  '/admin/news':         svg(<><rect x="3.5" y="5" width="13" height="15" rx="1.5" /><path d="M16.5 9H20v9a2 2 0 0 1-2 2" /><path d="M6.5 9h7M6.5 12.5h7M6.5 16h4" /></>),
  '/admin/links':        svg(<><path d="M9 15l6-6" /><path d="M10.5 6.5l1.2-1.2a4 4 0 0 1 5.7 5.7l-1.2 1.2" /><path d="M13.5 17.5l-1.2 1.2a4 4 0 0 1-5.7-5.7l1.2-1.2" /></>),
  '/admin/hr':           svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 4.5a3 3 0 0 1 0 6M18.5 19c0-2.2-1-4-2.7-4.6" /></>),
  '/admin/settings':     svg(<><path d="M4 8h8M18 8h2" /><circle cx="15" cy="8" r="2.4" /><path d="M4 16h4M14 16h6" /><circle cx="10.5" cy="16" r="2.4" /></>),
}

const groups: { title?: string; items: Item[] }[] = [
  {
    title: 'Продажи',
    items: [
      { href: '/admin',              label: 'Рабочий стол', roles: ALL },
      { href: '/admin/applications', label: 'Заявки',       roles: ALL },
      { href: '/admin/tasks',        label: 'Задачи',       roles: ALL },
      { href: '/admin/contacts',     label: 'База',         roles: ALL },
      { href: '/admin/training',     label: 'Обучение',     roles: ALL },
    ],
  },
  {
    title: 'Контент',
    items: [
      { href: '/admin/news',      label: 'Новости',     roles: CONTENT },
      { href: '/admin/links',     label: 'Ссылки',      roles: CONTENT },
    ],
  },
  {
    title: 'Найм',
    items: [
      { href: '/admin/hr',        label: 'Рекрутинг',   roles: HR },
    ],
  },
  {
    items: [
      { href: '/admin/settings', label: 'Настройки', roles: ALL },
    ],
  },
]

export default function AdminNav({ role, overdue = 0 }: { role?: Role; overdue?: number }) {
  const pathname = usePathname()
  if (!role) return null

  return (
    <>
      {groups.map((g, gi) => {
        const items = g.items.filter(n => n.roles.includes(role))
        if (!items.length) return null
        return (
          <div key={gi} style={{ marginTop: gi === 0 ? 0 : 14 }}>
            {g.title && (
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6388', padding: '0 14px', marginBottom: 5 }}>
                {g.title}
              </div>
            )}
            {items.map(n => {
              const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
              const badge = n.href === '/admin/tasks' && overdue > 0 ? overdue : 0
              return (
                <Link key={n.href} href={n.href} className={`nav-link ${active ? 'nav-link-active' : ''}`}>
                  <span className="nav-ico">{ICONS[n.href]}</span>
                  {n.label}
                  {badge > 0 && (
                    <span title={`Просроченных задач: ${badge}`} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                      background: '#e0574a', color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 0 2px rgba(224,87,74,0.25)',
                    }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
