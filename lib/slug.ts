// Транслитерация кириллицы и генерация slug для SEO-ссылок
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function translit(s: string): string {
  return (s || '').split('').map(ch => {
    const lower = ch.toLowerCase()
    const t = MAP[lower]
    if (t === undefined) return ch
    // сохраняем регистр для первой буквы (не критично для slug, но аккуратно)
    return ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1)
  }).join('')
}

export function slugify(name: string): string {
  return translit(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'guest'
}

// Короткий slug (обрезаем по словам до maxLen) — для длинных заголовков мероприятий
export function slugifyShort(name: string, maxLen = 60): string {
  const full = slugify(name)
  if (full.length <= maxLen) return full
  const cut = full.slice(0, maxLen)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '')
}
