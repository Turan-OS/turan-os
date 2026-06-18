import Link from 'next/link'
import type { Document } from '@/lib/supabase'
import MarkdownField from '@/components/MarkdownField'
import { saveDoc } from './actions'

export default function DocForm({ item }: { item: Document | null }) {
  return (
    <form action={saveDoc} className="form-panel">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="admin-label">Название</label>
          <input name="title" defaultValue={item?.title ?? ''} required className="admin-input" placeholder="Скрипт «Работа с базой клиентов»" />
        </div>
        <div>
          <label className="admin-label">Категория</label>
          <input name="category" defaultValue={item?.category ?? ''} className="admin-input" placeholder="Скрипты" />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="admin-label">Текст документа · Markdown</label>
        <MarkdownField name="content" defaultValue={item?.content ?? ''} rows={18}
          placeholder={'## Приветствие\n\n«Добрый день, [Имя]! Меня зовут…»\n\n## Выявление потребности\n\n- Вопрос 1\n- Вопрос 2'} />
      </div>

      <div style={{ background: '#f4f6f8', border: '1px solid #e4e7ec', borderRadius: 8, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: '#5b6470', lineHeight: 1.8 }}>
        <div><b style={{ color: '#3a4250' }}>Обычный документ:</b> <code style={{ color: '#127a98' }}>## Заголовок</code> · <code style={{ color: '#127a98' }}>**жирный**</code> · <code style={{ color: '#127a98' }}>- список</code> · таблица через <code style={{ color: '#127a98' }}>| столбец | столбец |</code></div>
        <div style={{ marginTop: 6 }}><b style={{ color: '#3a4250' }}>Скрипт продаж</b> (карточки этапов) — первой строкой <code style={{ color: '#127a98' }}>::script</code>, затем:</div>
        <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
          <code style={{ color: '#127a98' }}>## Этап</code> — плашка этапа · <code style={{ color: '#127a98' }}>~ что делает менеджер</code> · <code style={{ color: '#127a98' }}>— реплика</code> · <code style={{ color: '#127a98' }}>[условие] — реплика</code> · <code style={{ color: '#127a98' }}>! подсказка</code>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="admin-btn-primary" style={{ padding: '11px 28px', fontSize: 13 }}>Сохранить</button>
        <Link href="/admin/training/docs" className="admin-btn-ghost">Отмена</Link>
      </div>
    </form>
  )
}
