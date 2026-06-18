// "X% Y%" или ключевые слова object-position → доли 0..1 (точка фокуса)
export function parseFocal(p?: string): [number, number] {
  if (p && p.includes('%')) {
    const m = p.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/)
    if (m) return [parseFloat(m[1]) / 100, parseFloat(m[2]) / 100]
  }
  const map: Record<string, [number, number]> = {
    'center top': [0.5, 0], 'center center': [0.5, 0.5], center: [0.5, 0.5],
    'center bottom': [0.5, 1], 'left top': [0, 0], 'right top': [1, 0],
  }
  return map[p || ''] || [0.5, 0]
}
