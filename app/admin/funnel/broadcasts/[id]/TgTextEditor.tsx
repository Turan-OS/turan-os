'use client'

import { useRef, useState, useEffect } from 'react'

// Визуальный редактор текста Telegram-сообщения (WYSIWYG).
// В поле видно оформленный текст (жирный, курсив и т.д.), а не теги.
// Наружу (в скрытый input) отдаётся Telegram-HTML: <b> <i> <u> <s> <code> <tg-spoiler> <a href>.
// Воркер отправляет с parse_mode: HTML.

// ── Telegram-HTML → HTML для отображения в редакторе ──
function toEditorHtml(tg: string): string {
  if (!tg) return ''
  return tg
    .replace(/\r?\n/g, '<br>')
    .replace(/<tg-spoiler>/g, '<span data-spoiler="1" class="tg-spoiler-edit">')
    .replace(/<\/tg-spoiler>/g, '</span>')
}

// ── DOM редактора → Telegram-HTML для сохранения ──
const TAG_MAP: Record<string, string> = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', INS: 'u', S: 's', STRIKE: 's', DEL: 's', CODE: 'code' }
function serialize(node: Node): string {
  let out = ''
  node.childNodes.forEach(n => {
    if (n.nodeType === Node.TEXT_NODE) { out += n.textContent ?? ''; return }
    if (n.nodeType !== Node.ELEMENT_NODE) return
    const el = n as HTMLElement
    const tag = el.tagName
    if (tag === 'BR') { out += '\n'; return }
    if (tag === 'DIV' || tag === 'P') {
      if (out && !out.endsWith('\n')) out += '\n'
      out += serialize(el)
      return
    }
    if (el.dataset && el.dataset.spoiler) { out += '<tg-spoiler>' + serialize(el) + '</tg-spoiler>'; return }
    if (tag === 'A') { const href = el.getAttribute('href') || ''; out += `<a href="${href}">` + serialize(el) + '</a>'; return }
    const mapped = TAG_MAP[tag]
    if (mapped) { out += `<${mapped}>` + serialize(el) + `</${mapped}>`; return }
    out += serialize(el) // прочие обёртки — только содержимое
  })
  return out
}

export default function TgTextEditor({ name, defaultValue, max = 4000 }: {
  name: string
  defaultValue?: string
  rows?: number
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tg, setTg] = useState(defaultValue ?? '')
  const [len, setLen] = useState((defaultValue ?? '').replace(/<[^>]+>/g, '').length)

  // начальное содержимое ставим один раз (contentEditable управляется вручную, не Реактом)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = toEditorHtml(defaultValue ?? '')
    try { document.execCommand('styleWithCSS', false, 'false') } catch { /* deprecated, но работает */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sync = () => {
    if (!ref.current) return
    setTg(serialize(ref.current))
    setLen((ref.current.textContent ?? '').length)
  }

  const exec = (cmd: string) => {
    ref.current?.focus()
    try { document.execCommand(cmd) } catch { /* noop */ }
    sync()
  }

  // обернуть выделение в inline-элемент (для кода и спойлера — их нет в execCommand)
  const wrap = (make: () => HTMLElement) => {
    const editor = ref.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    const el = make()
    const text = range.toString() || 'текст'
    el.textContent = text
    range.deleteContents()
    range.insertNode(el)
    // курсор после вставки
    const after = document.createRange()
    after.setStartAfter(el); after.collapse(true)
    selection.removeAllRanges(); selection.addRange(after)
    sync()
  }

  const link = () => {
    const url = prompt('Ссылка (URL):', 'https://')
    if (!url) return
    ref.current?.focus()
    try { document.execCommand('createLink', false, url) } catch { /* noop */ }
    sync()
  }

  const btn: React.CSSProperties = { minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '1px solid #e4e7ec', background: '#fff', color: '#3a4250', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', padding: '0 8px' }
  const md = (e: React.MouseEvent) => e.preventDefault() // не терять выделение при клике по кнопке

  return (
    <div>
      <style>{`
        .tg-edit:empty:before{content:attr(data-ph);color:#aab2bd}
        .tg-edit{white-space:pre-wrap;word-break:break-word}
        .tg-edit code{background:#f0f2f5;border-radius:4px;padding:1px 5px;font-family:ui-monospace,monospace;font-size:.92em}
        .tg-edit .tg-spoiler-edit{background:#c3c9d1;border-radius:3px;padding:0 2px}
        .tg-edit a{color:#2a6fdb}
      `}</style>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
        <button type="button" title="Жирный" style={{ ...btn, fontWeight: 800 }} onMouseDown={md} onClick={() => exec('bold')}>Ж</button>
        <button type="button" title="Курсив" style={{ ...btn, fontStyle: 'italic' }} onMouseDown={md} onClick={() => exec('italic')}>К</button>
        <button type="button" title="Подчёркнутый" style={{ ...btn, textDecoration: 'underline' }} onMouseDown={md} onClick={() => exec('underline')}>Ч</button>
        <button type="button" title="Зачёркнутый" style={{ ...btn, textDecoration: 'line-through' }} onMouseDown={md} onClick={() => exec('strikeThrough')}>З</button>
        <button type="button" title="Моноширинный / код" style={{ ...btn, fontFamily: 'ui-monospace, monospace' }} onMouseDown={md} onClick={() => wrap(() => document.createElement('code'))}>{'</>'}</button>
        <button type="button" title="Скрытый текст (спойлер)" style={btn} onMouseDown={md} onClick={() => wrap(() => { const s = document.createElement('span'); s.dataset.spoiler = '1'; s.className = 'tg-spoiler-edit'; return s })}>👁‍🗨</button>
        <button type="button" title="Ссылка" style={btn} onMouseDown={md} onClick={link}>🔗</button>
      </div>

      <div
        ref={ref}
        className="admin-input tg-edit"
        contentEditable
        suppressContentEditableWarning
        data-ph="Текст сообщения в Telegram… Выдели текст и нажми кнопку, чтобы оформить."
        onInput={sync}
        onBlur={sync}
        style={{ minHeight: 130, maxHeight: 340, overflowY: 'auto', fontSize: 14, lineHeight: 1.55, cursor: 'text' }}
      />
      <input type="hidden" name={name} value={tg} readOnly />
      <div style={{ fontSize: 11, color: len > max ? '#d24a3d' : '#aab2bd', marginTop: 4, textAlign: 'right' }}>{len} / {max}</div>
    </div>
  )
}
