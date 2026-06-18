/**
 * Простой Markdown → HTML конвертер (без зависимостей).
 * Поддерживает: # ## ### заголовки, **жирный**, *курсив*,
 * - списки, [ссылки](url), пустая строка = новый абзац.
 *
 * Используется для полей content (полное описание) гостей,
 * мероприятий, новостей. Результат стилизуется классом .prose-dark
 */
export function mdToHtml(src: string): string {
  if (!src) return ''

  // 1) Сообщения с кнопкой «Скопировать»: блок «:::msg … :::».
  //    Внутренность рендерим рекурсивно и прячем в «карман», чтобы конвейер её не трогал.
  const stash: string[] = []
  src = src.replace(/^:::msg[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm, (_m, inner: string) => {
    const body = mdToHtml(inner.trim())
    const block =
      '<div class="msg-block" style="position:relative;background:#fff;border:1px solid #e8ebef;border-radius:12px;padding:14px 16px;margin:14px 0;box-shadow:0 1px 2px rgba(16,24,40,0.04)">'
      + '<div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button type="button" class="copy-btn" style="font-size:12px;font-weight:600;color:#00a35c;background:#f4faf6;border:1px solid #cdeedd;border-radius:7px;padding:5px 11px;cursor:pointer;font-family:inherit">⧉ Скопировать</button></div>'
      + `<div class="msg-body">${body}</div></div>`
    const token = `@@MSG${stash.length}@@`
    stash.push(block)
    return token
  })

  // экранируем «голый» HTML, чтобы не пускать произвольную разметку
  const esc = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let html = withTables(withCards(esc))
    // явный перенос строки <br> (в т.ч. внутри ячеек таблиц)
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    // цитаты: блок строк, начинающихся с «> »
    .replace(/(?:^&gt;[ \t]?.*(?:\n|$))+/gm, m => {
      const inner = m.replace(/\n+$/, '').split('\n').map(l => l.replace(/^&gt;[ \t]?/, '')).join('<br>')
      return `<blockquote>${inner}</blockquote>\n`
    })
    // горизонтальная линия --- *** ___
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '<hr>')
    // заголовки
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // жирный / курсив
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // ссылки [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // списки
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
    // абзацы: строки, не начинающиеся с тега, оборачиваем в <p>
    .split('\n')
    .map(line => {
      const t = line.trim()
      if (!t) return ''
      if (/^<(h2|h3|ul|li|\/ul|hr|table|blockquote|div)/.test(t)) return t
      if (/^@@MSG\d+@@$/.test(t)) return t
      return `<p>${t}</p>`
    })
    .join('\n')

  // возвращаем сообщения из «кармана» на место
  for (let i = 0; i < stash.length; i++) {
    html = html.replace(`<p>@@MSG${i}@@</p>`, stash[i]).replace(`@@MSG${i}@@`, stash[i])
  }
  return html
}

// Карточки: блок между «:::cards» и «:::». Каждый «### Заголовок» + текст под ним
// превращается в карточку. Рендерится сеткой .md-cards.
function withCards(src: string): string {
  return src.replace(/^:::cards[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm, (_m, inner: string) => {
    const parts = inner.split(/^###\s+/m).map(s => s.trim()).filter(Boolean)
    const cards = parts.map(p => {
      const nl = p.indexOf('\n')
      const title = (nl === -1 ? p : p.slice(0, nl)).trim()
      const body = (nl === -1 ? '' : p.slice(nl + 1)).trim().replace(/\n+/g, ' ')
      return `<div class="md-card"><div class="md-card-t">${title}</div>${body ? `<div class="md-card-b">${body}</div>` : ''}</div>`
    }).join('')
    return `<div class="md-cards">${cards}</div>`
  })
}

// GFM-таблицы: блок строк вида «| a | b |» со строкой-разделителем «| --- | --- |»
// превращаем в одну строку <table>…</table> (инлайн-разметка в ячейках
// обработается дальше по конвейеру).
function withTables(src: string): string {
  const lines = src.split('\n')
  const out: string[] = []
  const cells = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
  const isRow = (l?: string) => !!l && /^\s*\|.*\|\s*$/.test(l)
  const isSep = (l?: string) => !!l && /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes('-') && l.includes('|')

  let i = 0
  while (i < lines.length) {
    if (isRow(lines[i]) && isSep(lines[i + 1])) {
      const head = cells(lines[i])
      i += 2
      const body: string[][] = []
      while (i < lines.length && isRow(lines[i])) { body.push(cells(lines[i])); i++ }
      const headEmpty = head.every(c => !c)
      const thead = headEmpty ? '' : `<thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead>`
      const trs = body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
      out.push(`<table>${thead}<tbody>${trs}</tbody></table>`)
    } else {
      out.push(lines[i]); i++
    }
  }
  return out.join('\n')
}
