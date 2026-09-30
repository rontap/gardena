import { MUSHROOM_CHANCE, MUSHROOM_DAYS, MUSHROOM_TRUFFLE, type MushroomId } from '../../defs/mushroom.ts'
import { tierOf } from '../../defs/varieties.ts'
import type { Coord, Tree } from '../building.ts'
import { onCell } from '../drop.ts'
import { treeArea } from '../feature-field/field.ts'
import { openCover, type Plot } from '../plot.ts'
import type { World } from '../world.ts'

type Untilled = Extract<Plot, { kind: 'untilled' }>

function site(w: World, at: Coord): Untilled | undefined {
  if (!w.inWorld(at) || w.pavingAt(at) !== 'none' || onCell(w.drops, at).length > 0) return undefined
  const c = w.cell(at)
  return c.kind === 'untilled' && openCover(c) ? c : undefined
}

export function grownTrees(w: World): Tree[] {
  return [...w.grow.values()]
    .map(at => w.cell(at))
    .filter((c): c is Tree => c.kind === 'tree' && c.juvenile >= 1 && !c.trunk)
    .sort((a, b) => a.base.row - b.base.row || a.base.col - b.base.col)
}

export function mushroomSeam(w: World): void {
  const ended = w.clock.day - 1
  ;[...w.mushrooms.values()].forEach(at => {
    const c = w.cell(at)
    if (c.kind !== 'untilled' || c.cover.kind !== 'mushroom') throw new Error('mushroom')
    if (ended - c.cover.day < MUSHROOM_DAYS) return
    w.setCell(at, { kind: 'untilled', ground: c.ground, hardness: c.hardness, cover: { kind: 'bare' } })
  })
  const chance = MUSHROOM_CHANCE[w.weather(ended)]
  const stream = w.rng.stream('mushroom')
  grownTrees(w).forEach(t => {
    const draw = (i: number) => stream.at(t.base.col, t.base.row, ended, i)
    if (draw(0) >= chance) return
    const open = treeArea(t).flatMap(at => {
      const c = site(w, at)
      return c === undefined ? [] : [{ at, c }]
    })
    if (open.length === 0) return
    const { at, c } = open[Math.floor(draw(1) * open.length)]
    const id: MushroomId = draw(2) < MUSHROOM_TRUFFLE[tierOf(t.variety)] ? 'truffle' : 'fly-agaric'
    w.setCell(at, { kind: 'untilled', ground: c.ground, hardness: c.hardness, cover: { kind: 'mushroom', id, day: ended } })
  })
}
