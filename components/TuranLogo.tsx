// Логотип TURAN OS — временный текстовый плейсхолдер.
// Жду исходник логотипа от клиента — заменю на него (SVG/PNG) здесь же.
export default function TuranLogo({
  size = 22,
  tone = 'light', // 'light' = на тёмном фоне (белый текст), 'dark' = на светлом (тёмный текст)
}: { size?: number; tone?: 'light' | 'dark' }) {
  const ink = tone === 'light' ? '#ffffff' : '#291A42'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 800, fontSize: size, letterSpacing: '0.06em', color: ink, lineHeight: 1, whiteSpace: 'nowrap', userSelect: 'none' }}>
      TURAN<span style={{ color: '#1EAAD1', marginLeft: size * 0.28 }}>OS</span>
    </span>
  )
}
