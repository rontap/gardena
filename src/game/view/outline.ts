import { TILE } from './camera.ts'

export type Outline = { d: string; x: number; y: number; w: number; h: number }

const STROKE = 2
const PAD = STROKE / 2

function key(a: string, b: string): string {
  return `${a}>${b}`
}

function ends(e: string): [string, string] {
  const i = e.indexOf('>')
  return [e.slice(0, i), e.slice(i + 1)]
}

export function footOutline(cells: readonly { col: number; row: number }[]): Outline | undefined {
  if (cells.length === 0) return undefined
  const cols = cells.map(c => c.col)
  const rows = cells.map(c => c.row)
  const minCol = Math.min(...cols)
  const minRow = Math.min(...rows)
  const edges = new Set<string>()
  cells.forEach(c => {
    const x = c.col - minCol
    const y = c.row - minRow
    ;(
      [
        [`${x},${y}`, `${x + 1},${y}`],
        [`${x + 1},${y}`, `${x + 1},${y + 1}`],
        [`${x + 1},${y + 1}`, `${x},${y + 1}`],
        [`${x},${y + 1}`, `${x},${y}`],
      ] as const
    ).forEach(([a, b]) => {
      const rev = key(b, a)
      if (edges.has(rev)) edges.delete(rev)
      else edges.add(key(a, b))
    })
  })
  const next = new Map<string, string[]>()
  edges.forEach(e => {
    const [a, b] = ends(e)
    const list = next.get(a)
    if (list === undefined) next.set(a, [b])
    else list.push(b)
  })
  const px = (k: string): string => {
    const i = k.indexOf(',')
    return `${Number(k.slice(0, i)) * TILE + PAD} ${Number(k.slice(i + 1)) * TILE + PAD}`
  }
  const parts: string[] = []
  for (;;) {
    const it = next.keys().next()
    if (it.done) break
    const start = it.value
    const loop = [start]
    let at = start
    for (;;) {
      const outs = next.get(at)
      if (outs?.length === 0) throw new Error('outline')
      const to = outs[outs.length - 1]
      outs.pop()
      if (outs.length === 0) next.delete(at)
      if (to === start) break
      loop.push(to)
      at = to
    }
    parts.push(`M ${loop.map(px).join(' L ')} Z`)
  }
  return {
    d: parts.join(' '),
    x: minCol * TILE - PAD,
    y: minRow * TILE - PAD,
    w: (Math.max(...cols) + 1 - minCol) * TILE + STROKE,
    h: (Math.max(...rows) + 1 - minRow) * TILE + STROKE,
  }
}
