'use server'

import { getCurrentUser } from '@/lib/currentUser'
import { notifyTelegram } from '@/lib/telegram'

// Сообщаем куратору результат теста (для контроля). Запись в БД не требуется.
export async function notifyExamResult(correct: number, total: number, passed: boolean) {
  const me = await getCurrentUser()
  if (!me) return
  const pct = total ? Math.round((correct / total) * 100) : 0
  await notifyTelegram(
    `🎓 <b>Аттестация (тест)</b>\n${me.name}: <b>${correct}/${total}</b> (${pct}%) — ${passed ? '✅ сдал(а)' : '❌ не сдал(а)'}`,
  ).catch(() => {})
}
