import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/currentUser'
import { STATUS_META, normalizeMedia, type ContentPost } from '@/lib/content'
import PostEditor from '../PostEditor'
import { setStatus, deletePost } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me || !['admin', 'administrator'].includes(me.role)) {
    return <div style={{ padding: 20, color: '#8a929c' }}>Недостаточно прав.</div>
  }
  const { id } = await params
  const { data } = await supabaseAdmin.from('content_posts').select('*').eq('id', Number(id)).maybeSingle()
  if (!data) notFound()
  const post = { ...(data as ContentPost), media: normalizeMedia((data as ContentPost).media) }
  const st = STATUS_META[post.status] ?? STATUS_META.idea

  return (
    <div style={{ maxWidth: 1100 }}>
      <Link href="/admin/content" style={{ fontSize: 13, color: '#8a929c', textDecoration: 'none' }}>← Контент-план</Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', margin: '10px 0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{post.title || 'Без темы'}</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 7, color: st.color, background: st.bg }}>{st.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {post.status !== 'approved' && post.status !== 'published' ? (
            <form action={setStatus}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="status" value="approved" />
              <button type="submit" className="admin-btn-primary" style={{ padding: '9px 18px', background: '#00955a' }}>✓ Утвердить</button>
            </form>
          ) : post.status === 'approved' ? (
            <form action={setStatus}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="status" value="review" />
              <button type="submit" className="admin-btn-ghost" style={{ padding: '9px 16px' }}>Снять утверждение</button>
            </form>
          ) : null}
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="admin-btn-danger" style={{ padding: '9px 16px' }}>Удалить</button>
          </form>
        </div>
      </div>

      {post.status === 'approved' && post.approved_by_name && (
        <div style={{ fontSize: 13, color: '#00955a', marginBottom: 18 }}>
          ✓ Утвердил: <b>{post.approved_by_name}</b>{post.approved_at ? ` · ${new Date(post.approved_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}` : ''}
        </div>
      )}

      <PostEditor post={post} />
    </div>
  )
}
