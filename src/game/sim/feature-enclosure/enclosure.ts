import type { Coord } from '../building.ts'
import type { World } from '../world.ts'
import type { Enclosure, EnclosureId } from './enclosure.h.ts'

export type { Enclosure, EnclosureId }

const AROUND: readonly { dc: number; dr: number }[] = [-1, 0, 1].flatMap(dr =>
  [-1, 0, 1].filter(dc => dc !== 0 || dr !== 0).map(dc => ({ dc, dr })),
)

function key(at: Coord): string {
  return `${at.col},${at.row}`
}

export function rebuild(w: World): void {
  w.enclosures.clear()
  w.fenceEnclosures.clear()
  w.plotEnclosures.clear()
  const { col0, row0, col1, row1 } = w.bounds()
  const leaked = new Set<string>()
  const queue: Coord[] = []
  for (let row = row0 - 1; row <= row1; row++) {
    for (let col = col0 - 1; col <= col1; col++) {
      const at = { col, row }
      if (w.inWorld(at)) continue
      queue.push(at)
    }
  }
  let q = 0
  while (q < queue.length) {
    const cur = queue[q]
    q += 1
    AROUND.forEach(({ dc, dr }) => {
      const at = { col: cur.col + dc, row: cur.row + dr }
      if (!w.inWorld(at) || w.hasFence(at)) return
      const k = key(at)
      if (leaked.has(k)) return
      leaked.add(k)
      queue.push(at)
    })
  }
  const enclosed: Coord[] = []
  for (let row = row0; row < row1; row++) {
    for (let col = col0; col < col1; col++) {
      const at = { col, row }
      if (!w.inWorld(at) || w.hasFence(at)) continue
      if (leaked.has(key(at))) continue
      enclosed.push(at)
    }
  }
  const assigned = new Set<string>()
  let id: EnclosureId = 1
  enclosed.forEach(start => {
    if (assigned.has(key(start))) return
    const interior: Coord[] = []
    const flood = [start]
    assigned.add(key(start))
    let i = 0
    while (i < flood.length) {
      const cur = flood[i]
      i += 1
      interior.push(cur)
      AROUND.forEach(({ dc, dr }) => {
        const at = { col: cur.col + dc, row: cur.row + dr }
        const k = key(at)
        if (!w.inWorld(at) || w.hasFence(at) || leaked.has(k) || assigned.has(k)) return
        assigned.add(k)
        flood.push(at)
      })
    }
    const fenceKeys = new Set<string>()
    const fences: Coord[] = []
    interior.forEach(c => {
      AROUND.forEach(({ dc, dr }) => {
        const at = { col: c.col + dc, row: c.row + dr }
        if (!w.hasFence(at)) return
        const k = key(at)
        if (fenceKeys.has(k)) return
        fenceKeys.add(k)
        fences.push(at)
      })
    })
    w.enclosures.set(id, { id, interior, fences })
    interior.forEach(c => {
      const k = key(c)
      const list = w.plotEnclosures.get(k)
      if (list === undefined) w.plotEnclosures.set(k, [id])
      else list.push(id)
    })
    fences.forEach(c => {
      const k = key(c)
      const list = w.fenceEnclosures.get(k)
      if (list === undefined) w.fenceEnclosures.set(k, [id])
      else list.push(id)
    })
    id += 1
  })
}

export function lookup(w: World, at: Coord): Coord[] {
  const ids = w.fenceEnclosures.get(key(at))
  if (ids === undefined) return []
  const seen = new Set<string>()
  return ids.flatMap(id => {
    const enc = w.enclosures.get(id)
    if (enc === undefined) throw new Error('enclosure')
    return enc.interior.filter(c => {
      const k = key(c)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  })
}
