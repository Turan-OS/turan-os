import Link from 'next/link'
import type { Lesson } from '@/lib/supabase'
import MaterialsEditor from '../MaterialsEditor'
import MarkdownField from '@/components/MarkdownField'
import { saveLesson } from './actions'

export default function LessonForm({ item, docs }: { item: Lesson | null; docs: { slug: string; title: string }[] }) {
  return (
    <form action={saveLesson} className="form-panel">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="admin-label">День №</label>
          <input type="number" name="day_number" min={1} defaultValue={item?.day_number ?? 1} required className="admin-input" />
        </div>
        <div>
          <label className="admin-label">Название</label>
          <input name="title" defaultValue={item?.title ?? ''} required className="admin-input" placeholder="Знакомство с продуктом и скриптами" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="admin-label">Ссылка на видео (YouTube / Vimeo)</label>
        <input name="video_url" defaultValue={item?.video_url ?? ''} className="admin-input" placeholder="https://youtu.be/..." />
      </div>

      <MaterialsEditor initial={item?.materials} docs={docs} />

      <div style={{ marginBottom: 16 }}>
        <label className="admin-label">Материал дня · Markdown</label>
        <MarkdownField name="content" defaultValue={item?.content ?? ''} rows={10}
          placeholder={'## Что разберём сегодня\n\nТекст урока...\n\n- Пункт\n- Пункт\n\n**Важно:** ...'} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="admin-label">Домашнее задание</label>
        <textarea name="homework" defaultValue={item?.homework ?? ''} rows={4} className="admin-input"
          placeholder="Что менеджер должен сделать и прислать после изучения материала." style={{ resize: 'vertical', height: 'auto' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#3a4250', cursor: 'pointer' }}>
        <input type="checkbox" name="published" defaultChecked={item ? item.published : true} style={{ width: 16, height: 16, accentColor: '#1EAAD1' }} />
        Опубликован (виден ученикам)
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="admin-btn-primary" style={{ padding: '11px 28px', fontSize: 13 }}>Сохранить</button>
        <Link href="/admin/training" className="admin-btn-ghost">Отмена</Link>
      </div>
    </form>
  )
}
