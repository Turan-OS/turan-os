import { redirect } from 'next/navigation'

// Раздел «Воронка» разбит на два пункта меню: Мини-лендинги и Авторассылки.
// Старый общий путь ведём на мини-лендинги.
export default function FunnelRedirect() {
  redirect('/admin/funnel/landings')
}
