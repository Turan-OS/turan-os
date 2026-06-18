import { supabaseAdmin } from './supabase'

type HistoryTable = 'application_comments' | 'application_tasks' | 'application_activity'

// Вставка строки истории. Если колонки contact_id ещё нет в БД (миграция не выполнена),
// делаем повтор без неё — чтобы добавление заметок/звонков/задач работало в любом случае.
export async function insertHistory(table: HistoryTable, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin.from(table).insert(row)
  if (error && /contact_id/i.test(error.message)) {
    const { contact_id, ...rest } = row
    await supabaseAdmin.from(table).insert(rest)
  }
}
