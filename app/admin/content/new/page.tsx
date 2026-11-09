import Link from 'next/link'
import { getCurrentUser } from '@/lib/currentUser'
import PostEditor from '../PostEditor'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const me = await getCurrentUser()
  if (!me || !['admin', 'administrator'].includes(me.role)) {
    return <div style={{ padding: 20, color: '#8a929c' }}>Недостаточно прав.</div>
  }
  return (
    <div style={{ maxWidth: 1100 }}>
      <Link href="/admin/content" style={{ fontSize: 13, color: '#8a929c', textDecoration: 'none' }}>← Контент-план</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '10px 0 22px' }}>Новый пост</h1>
      <PostEditor />
    </div>
  )
}
