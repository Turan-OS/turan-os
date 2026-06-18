import Link from 'next/link'
import type { News } from '@/lib/supabase'
import ImageField from './ImageField'
import MarkdownField from '@/components/MarkdownField'
import { saveNews } from './actions'

export default function NewsForm({ item }: { item: News | null }) {
  return (
    <form action={saveNews} className="form-panel">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div style={{ marginBottom: 16 }}>
        <label className="admin-label">Заголовок</label>
        <input name="title" defaultValue={item?.title ?? ''} required className="admin-input" placeholder="Итоги первого полугодия 2026" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="admin-label">Краткое описание <span style={{ color: '#aab2bd', fontWeight: 400 }}>· для карточки</span></label>
        <textarea name="description" defaultValue={item?.description ?? ''} rows={2} required className="admin-input"
          placeholder="1–2 предложения, видно в списке новостей" style={{ resize: 'vertical', height: 'auto' }} />
      </div>

      <ImageField initialUrl={item?.image_url} folder="news" />

      <div style={{ marginBottom: 12 }}>
        <label className="admin-label">Полный текст · Markdown</label>
        <MarkdownField name="content" defaultValue={item?.content ?? ''} rows={12}
          placeholder={'## Подзаголовок\n\nТекст новости.\n\n**Жирный**, *курсив*, списки, ссылки, таблицы.'} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 6px', cursor: 'pointer' }}>
        <input type="checkbox" name="published" defaultChecked={item ? item.published !== false : true}
          style={{ width: 16, height: 16, accentColor: '#1EAAD1', cursor: 'pointer' }} />
        <span style={{ fontSize: 13, color: '#4a5260' }}>Опубликована <span style={{ color: '#aab2bd', fontWeight: 400 }}>· видна на сайте (выключи — будет черновиком)</span></span>
      </label>

      {item?.date && (
        <p style={{ fontSize: 12, color: '#8a929c', margin: '4px 0 24px' }}>
          Дата: {item.date} <span style={{ color: '#aab2bd' }}>· ставится автоматически. Показ даты — общий тумблер в «Настройки → Сайт».</span>
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: item?.date ? 0 : 16 }}>
        <button type="submit" className="admin-btn-primary" style={{ padding: '11px 28px', fontSize: 13 }}>Сохранить</button>
        <Link href="/admin/news" className="admin-btn-ghost">Отмена</Link>
      </div>
    </form>
  )
}
