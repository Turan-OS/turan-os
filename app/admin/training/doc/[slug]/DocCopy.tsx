'use client'

import { useEffect } from 'react'

// Включает кнопки «Скопировать» (.copy-btn) внутри отрендеренного Markdown.
export default function DocCopy() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLElement | null
      if (!btn) return
      const body = btn.closest('.msg-block')?.querySelector('.msg-body') as HTMLElement | null
      const text = (body?.innerText || '').trim()
      if (!text) return
      navigator.clipboard?.writeText(text)
      const prev = btn.textContent
      btn.textContent = '✓ Скопировано'
      btn.style.color = '#127a98'
      setTimeout(() => { btn.textContent = prev; }, 1500)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
