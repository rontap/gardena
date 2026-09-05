import { CHUNK, chunkKey, chunkRect, inFade, inWorld, type ChunkId, type Coord } from '../building.ts'
import { generateChunk } from '../gen.ts'
import type { SkuId } from '../ids.ts'
import { skuItem } from '../item.ts'
import { aoe, edgeKey, vertexKey, vertsOf, type Edge, type Sprinkler, type Vertex } from '../pipe.ts'
import { isPlot } from '../plot.ts'
import { maybeSay, NOT_OWNED, readPrompt, valvePrompt } from '../prompt.ts'
import { hitsEdge, hitsVertex } from '../sensor.ts'
import type { BuyFail, ExpandFace, World } from '../world.ts'
import { confirmPlace, deleteBuildingBody, pruneVert } from './place.helpers.ts'

export { confirmPlace, deleteBuildingBody }

export function faces(w: World): ExpandFace[] {
  if (!w.done.has('unlock-expand')) return []
  const have = new Set(w.owned.map(chunkKey))
  const seen = new Set<string>()
  const price = w.expandPrice()
  const out: ExpandFace[] = []
  const dirs = [
    { dir: 'n' as const, dcx: 0, dcy: -1 },
    { dir: 'e' as const, dcx: 1, dcy: 0 },
    { dir: 's' as const, dcx: 0, dcy: 1 },
    { dir: 'w' as const, dcx: -1, dcy: 0 },
  ]
  w.owned.forEach(o => {
    const rect = chunkRect(o)
    dirs.forEach(d => {
      const id = { cx: o.cx + d.dcx, cy: o.cy + d.dcy }
      const key = chunkKey(id)
      if (have.has(key) || seen.has(key)) return
      seen.add(key)
      const at =
        d.dir === 'n'
          ? { col: rect.col0 + CHUNK / 2, row: rect.row0 - 1 }
          : d.dir === 'e'
            ? { col: rect.col1, row: rect.row0 + CHUNK / 2 }
            : d.dir === 's'
              ? { col: rect.col0 + CHUNK / 2, row: rect.row1 }
              : { col: rect.col0 - 1, row: rect.row0 + CHUNK / 2 }
      out.push({ id, dir: d.dir, at, price })
    })
  })
  return out
}

export function expandBody(w: World, id: ChunkId): void {
  if (!w.done.has('unlock-expand')) return
  if (w.expandLeft() <= 0) return
  if (w.owned.some(c => c.cx === id.cx && c.cy === id.cy)) return
  if (!w.owned.some(c => Math.abs(c.cx - id.cx) + Math.abs(c.cy - id.cy) === 1)) return
  const price = w.expandPrice()
  if (w.money < price) return
  w.money -= price
  w.owned.push(id)
  w.purchases += 1
  w.dirtyNets()
  w.sprinklerTargetCache.clear()
  w.chunks.set(
    chunkKey(id),
    generateChunk(w.rng, id, w.house, w.pumps[0], w.truck, w.silo, w.additives),
  )
  w.indexAll()
  w.ping()
}

export function placePipeBody(w: World, e: Edge): void {
  if (w.act.place.kind !== 'sku') return
  const id = w.act.place.id
  if (id !== 'buy-pipe' && id !== 'buy-valve') return
  if (w.money < w.skuPrice(id)) return
  if (!w.edgeOwned(e)) return
  if (id === 'buy-pipe') {
    if (w.hasPipe(e)) return
    w.segments.set(edgeKey(e), { at: e, gate: { kind: 'bare' } })
    vertsOf(e).forEach(v => w.netVerts.add(vertexKey(v)))
  } else if (id === 'buy-valve') {
    const seg = w.segmentAt(e)
    if (seg === undefined) {
      const total = w.skuPrice('buy-pipe') + w.skuPrice('buy-valve')
      if (w.money < total) return
      w.segments.set(edgeKey(e), { at: e, gate: { kind: 'valve', open: true } })
      vertsOf(e).forEach(v => w.netVerts.add(vertexKey(v)))
      w.money -= total
      w.dirtyNets()
      w.ping()
      return
    }
    if (seg.gate.kind !== 'bare') return
    seg.gate = { kind: 'valve', open: true }
  }
  w.money -= w.skuPrice(id)
  w.dirtyNets()
  w.ping()
}

export function deletePipeBody(w: World, e: Edge): void {
  if (w.act.place.kind !== 'delete') return
  const seg = w.segmentAt(e)
  if (!w.edgeOwned(e) || seg === undefined) return
  if (seg.gate.kind === 'valve') {
    seg.gate = { kind: 'bare' }
    w.dropWires(wire => hitsEdge(wire.from, e) || hitsEdge(wire.to, e))
  } else {
    w.segments.delete(edgeKey(e))
    pruneVert(w, e)
  }
  w.dirtyNets()
  w.ping()
}

export function placeSprinklerBody(w: World, s: Sprinkler): void {
  const id = sprinklerSku(s)
  if (w.act.place.kind !== 'sku' || w.act.place.id !== id) return
  if (w.money < w.skuPrice(id)) return
  if (!w.vertexOwned(s.at)) return
  if (w.sprinklerAt(s.at) !== undefined) return
  const placed: Sprinkler =
    w.act.place.id === 'buy-sprinkler-vert'
      ? { variant: 'vert', at: s.at, facing: w.act.place.facing, tune: { kind: 'flat' }, inn: 0, hold: 0 }
      : { ...s, inn: 0, hold: 0 }
  if (!aoe(placed).every(c => w.inWorld(c))) return
  w.money -= w.skuPrice(id)
  w.sprinklers.set(vertexKey(placed.at), placed)
  w.sprinklerTargetCache.delete(vertexKey(placed.at))
  w.netVerts.add(vertexKey(placed.at))
  w.dirtyNets()
  w.ping()
}

export function deleteSprinklerBody(w: World, v: Vertex): void {
  if (w.act.place.kind !== 'delete') return
  if (w.sprinklerAt(v) === undefined) return
  w.sprinklers.delete(vertexKey(v))
  w.sprinklerTargetCache.delete(vertexKey(v))
  w.dropWires(wire => hitsVertex(wire.from, v) || hitsVertex(wire.to, v))
  pruneVert(w, v)
  w.dirtyNets()
  w.ping()
}

export function armDeleteBody(w: World): void {
  w.act.place = { kind: 'delete' }
  w.ping()
}

export function rotatePlaceBody(w: World): void {
  if (w.act.place.kind !== 'sku' || w.act.place.id !== 'buy-sprinkler-vert') return
  w.act.place = {
    kind: 'sku',
    id: 'buy-sprinkler-vert',
    facing: w.act.place.facing === 'ns' ? 'ew' : 'ns',
  }
  w.ping()
}

export function clickBody(w: World, at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
  if (w.driverVehicle(w.act.id) !== undefined) return 'noop'
  if (!inWorld(at, w.owned)) {
    if (inFade(at, w.owned) && w.act.place.kind === 'none') w.say(NOT_OWNED)
    return 'noop'
  }
  const p = readPrompt(w, at)
  if (p.kind === 'intent') {
    w.enqueueOn(w.act, p.intent)
    return 'queued'
  }
  if (p.kind === 'place') {
    confirmPlace(w, at)
    return 'placed'
  }
  if (w.act.place.kind === 'none' && inWorld(at, w.owned)) maybeSay(w, at, p.text)
  return 'blocked'
}

export function clickValveBody(w: World, e: Edge): void {
  const p = valvePrompt(w, e)
  if (p.kind !== 'intent') return
  w.enqueueOn(w.act, p.intent)
}

export function buyBody(w: World, id: SkuId): BuyFail | undefined {
  if (!w.skuOpen(id)) return undefined
  const made = skuItem(id)
  if (made.kind === 'grass-seeds') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (!canFitGrass(w)) return 'Inventory full'
    w.money -= price
    putGrass(w, made.count)
    w.compactInventory()
    w.ping()
    return undefined
  }
  if (made.kind === 'sugar') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.additives.free < made.liters) return 'Additive store full'
    w.money -= price
    w.putSugar(made.liters, made.unitSale, made.quality)
    w.ping()
    return undefined
  }
  if (made.kind === 'seeds') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.silo.free < made.count) return 'Seed silo full'
    w.money -= price
    w.putSilo(made.crop, 'base', 0, made.count)
    w.ping()
    return undefined
  }
  if (made.kind === 'fertilizer' || made.kind === 'synth' || made.kind === 'weed-spray') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.additives.free < made.liters) return 'Additive store full'
    w.money -= price
    w.putAdditive(made.kind, made.liters)
    w.ping()
    return undefined
  }
  if (id === 'buy-sprinkler-vert') w.act.place = { kind: 'sku', id: 'buy-sprinkler-vert', facing: 'ns' }
  else w.act.place = { kind: 'sku', id }
  w.ping()
  return undefined
}

export function cancelPlaceBody(w: World): void {
  if (w.act.place.kind === 'none') return
  w.act.place = { kind: 'none' }
  w.ping()
}

export function rightClickBody(w: World, at: Coord): void {
  if (w.act.place.kind !== 'none') {
    cancelPlaceBody(w)
    return
  }
  if (!inWorld(at, w.owned)) return
  if (!isPlot(w.cell(at))) return
  if (w.act.hand.kind !== 'hold') return
  w.enqueueOn(w.act, { act: 'drop', at: { ...at } })
}

export function buyPacksBody(w: World, id: SkuId): void {
  if (buyPacksFail(w, id) !== undefined) return
  const made = skuItem(id)
  if (made.kind !== 'seeds') return
  w.money -= packsPrice(w, id)
  w.putSilo(made.crop, 'base', 0, 5 * made.count)
  w.ping()
}

export function packsPrice(w: World, id: SkuId): number {
  return 5 * w.skuPrice(id) * 0.95
}

export function buyPacksFail(w: World, id: SkuId): BuyFail | 'Locked' | undefined {
  if (!w.skuOpen(id)) return 'Locked'
  const made = skuItem(id)
  if (made.kind !== 'seeds') return 'Locked'
  if (w.money < packsPrice(w, id)) return 'Cannot afford'
  if (w.silo.free < 5 * made.count) return 'Seed silo full'
  return undefined
}

function sprinklerSku(s: Sprinkler): SkuId {
  if (s.variant === 'basic') return 'buy-sprinkler'
  if (s.variant === 'vert') return 'buy-sprinkler-vert'
  return 'buy-sprinkler-large'
}

function grassSlot(w: World): number {
  return w.act.inventory.findIndex(s => s.kind === 'hold' && s.item.kind === 'grass-seeds')
}

function canFitGrass(w: World): boolean {
  return grassSlot(w) >= 0 || w.act.inventory.some(s => s.kind === 'empty')
}

function putGrass(w: World, count: number): void {
  const merge = grassSlot(w)
  if (merge >= 0) {
    const slot = w.act.inventory[merge]
    if (slot.kind === 'hold' && slot.item.kind === 'grass-seeds') slot.item.count += count
    return
  }
  w.act.inventory[w.act.inventory.findIndex(s => s.kind === 'empty')] = {
    kind: 'hold',
    item: { kind: 'grass-seeds', count },
  }
}
