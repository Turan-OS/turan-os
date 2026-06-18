// Парсер «скрипт-документов» в красивые карточки этапов.
// Формат (в поле content документа):
//
//   ::script
//   Цель звонка: ...                 ← вступление (баннер)
//
//   ## Название этапа               ← новый этап (плашка)
//   ~ что делает менеджер           ← цель/действие (необязательно)
//   — реплика менеджера             ← что сказать (карточка)
//   [если имя известно] — реплика   ← реплика с условием-веткой
//   ! комментарий / подсказка       ← заметка-акцент

export interface ScriptSay { cond?: string; text: string }
export interface ScriptStage { title: string; instruction?: string; says: ScriptSay[]; tips: string[] }
export interface ParsedScript { intro?: string; stages: ScriptStage[] }

export function isScript(content?: string): boolean {
  return !!content && content.trimStart().toLowerCase().startsWith('::script')
}

function stripDash(s: string): string {
  return s.replace(/^\s*[—–-]\s*/, '').trim()
}

export function parseScript(content: string): ParsedScript {
  const body = content.replace(/^\s*::script[^\n]*\n?/i, '')
  const lines = body.split('\n')
  const stages: ScriptStage[] = []
  let introParts: string[] = []
  let cur: ScriptStage | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('## ')) {
      cur = { title: line.slice(3).trim(), says: [], tips: [] }
      stages.push(cur)
      continue
    }
    if (!cur) { introParts.push(line); continue }

    if (line.startsWith('~ ')) {
      cur.instruction = (cur.instruction ? cur.instruction + ' ' : '') + line.slice(2).trim()
      continue
    }
    if (line.startsWith('! ')) { cur.tips.push(line.slice(2).trim()); continue }

    const cond = line.match(/^\[(.+?)\]\s*(.+)$/)
    if (cond) { cur.says.push({ cond: cond[1].trim(), text: stripDash(cond[2]) }); continue }

    cur.says.push({ text: stripDash(line) })
  }

  let intro = introParts.join(' ').trim()
  intro = intro.replace(/^цель звонка:?\s*/i, '').trim()
  return { intro: intro || undefined, stages }
}
