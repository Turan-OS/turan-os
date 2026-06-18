// Логотип TURAN OS. Использует фирменный SVG из public/images.
// size — высота логотипа в px, ширина считается по пропорции (307×47).
// tone: 'light' = белый логотип (на тёмном фоне), 'dark' = тёмный (на светлом).
const ASPECT = 307 / 47

export default function TuranLogo({
  size = 22,
  tone = 'light',
}: { size?: number; tone?: 'light' | 'dark' }) {
  const src = tone === 'light' ? '/images/logo_white.svg' : '/images/logo.svg'
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="TURAN OS"
      width={Math.round(size * ASPECT)}
      height={size}
      style={{ height: size, width: 'auto', display: 'block', userSelect: 'none' }}
      draggable={false}
    />
  )
}
