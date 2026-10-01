import { describe, expect, test } from 'vitest'
import { m } from '../../../paraglide/messages.js'
import {
  BURROW_ENTRIES,
  BURROW_MUL,
  BURROW_RARE_MAX,
  BURROW_RARITIES,
  BURROW_SPECIAL_SHARE,
  BURROW_START_N,
  BURROW_START_R,
  BURROW_TREASURE_MAX,
  BURROW_TREASURE_MIN,
  AGARIC_LOOT_COUNT,
  BURROW_TREASURE_UNCOMMON_MAX,
  BURROW_TREASURE_UNCOMMON_MIN,
  SKILL_POINT_LOOT,
  TRUFFLE_LOOT_COUNT,
  burrowDayChance,
  type BurrowLand,
  type BurrowRarity,
} from '../../defs/burrow.ts'
import { AXES, COMPOST_VALUE, FURNACE_VALUE, PICKAXES, SHOVELS } from '../../defs/items.ts'
import { catalogEntries } from '../../defs/catalog.ts'
import { tierOf } from '../../defs/varieties.ts'
import { chunkOf, chunkRect, frontOf, isReserved, type ChunkId, type Coord } from '../building.ts'
import { onCell } from '../drop.ts'
import { dump, parse } from '../feature-save/save.ts'
import { seedPair } from '../feature-field/field.helpers.ts'
import { compostValue, furnaceValue, makePickaxe, makeShovel, type Item } from '../item.ts'
import { lookText } from '../look.ts'
import { isFenceSite, isSolid, isPavingSite } from '../plot.ts'
import { placeSolidOk, readPrompt } from '../prompt.ts'
import { Rng } from '../rng.ts'
import { DT_MAX, World } from '../world.ts'
import { BURROW_DAY_SALT, burrowOdds, digBurrow, doorR, extractBurrow, rarityOf } from './burrow.ts'
import type { BurrowDig } from './burrow.h.ts'

const AT = { col: 10, row: 12 }

function firstBurrow(w: World) {
  return [...w.burrows.values()][0]
}

function digger(seed: number): World {
  const w = new World(seed)
  w.act = w.seats[0]
  w.seats[0].hand = { kind: 'hold', item: makeShovel('rotary-shovel') }
  return w
}

function grid(from: number, n: number): Coord[] {
  return Array.from({ length: n * n }, (_, i) => ({ col: from + (i % n), row: from + Math.floor(i / n) }))
}

function findTile(w: World, sinceRare: number, want: (d: BurrowDig) => boolean): Coord {
  const at = grid(0, 32).find(p => {
    const c = w.cell(p)
    return c.kind === 'untilled' && !isReserved(p) && want(digBurrow(w.rng, p, w.clock.day, sinceRare))
  })
  if (at === undefined) throw new Error('tile')
  return at
}

function digAt(w: World, at: Coord): void {
  w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'burrow' } })
  extractBurrow(w, at)
}

const START: ChunkId = { cx: 0, cy: 0 }
const EAST: ChunkId = { cx: 1, cy: 0 }

function mints(seed: number, id: ChunkId, land: BurrowLand, rank: number): boolean {
  return new Rng(seed).stream('burrow').at(id.cx, id.cy, 2, BURROW_DAY_SALT) < burrowDayChance(land, rank)
}

function seedWhere(ok: (seed: number) => boolean): number {
  const seed = Array.from({ length: 400 }, (_, i) => i + 1).find(ok)
  if (seed === undefined) throw new Error('seed')
  return seed
}

function toolUses(item: Item): number {
  if (item.kind === 'shovel') return SHOVELS[item.id].uses
  if (item.kind === 'pickaxe') return PICKAXES[item.id].uses
  if (item.kind === 'axe') return AXES[item.id].uses
  throw new Error(item.kind)
}

function fits(rarity: BurrowRarity, d: BurrowDig): boolean {
  const f = d.find
  if (f.kind === 'permit') return rarity === 'rare'
  if (f.kind === 'skill-point') return rarity === 'uncommon'
  const it = f.item
  switch (rarity) {
    case 'common':
      if (it.kind === 'seeds' || it.kind === 'tree-seed') return tierOf(it.variety) === 'base'
      if (it.kind === 'shovel' || it.kind === 'pickaxe' || it.kind === 'axe') {
        const uses = toolUses(it)
        return ['better-shovel', 'better-pickaxe', 'axe'].includes(it.id) && (it.usesLeft === uses || it.usesLeft === Math.floor(uses / 2))
      }
      if (it.kind === 'treasure') return it.coins >= BURROW_TREASURE_MIN && it.coins <= BURROW_TREASURE_MAX
      return it.kind === 'weed'
    case 'uncommon':
      if (it.kind === 'seeds' || it.kind === 'tree-seed') return tierOf(it.variety) === 'variant'
      if (it.kind === 'treasure') return it.coins >= BURROW_TREASURE_UNCOMMON_MIN && it.coins <= BURROW_TREASURE_UNCOMMON_MAX
      return it.kind === 'fly-agaric' && it.count === AGARIC_LOOT_COUNT
    case 'rare':
      if (it.kind === 'seeds' || it.kind === 'tree-seed') return tierOf(it.variety) === 'heirloom'
      if (it.kind === 'shovel' || it.kind === 'pickaxe' || it.kind === 'axe') {
        return ['rotary-shovel', 'diamond-pickaxe', 'electric-chainsaw'].includes(it.id) && it.usesLeft === Math.round(toolUses(it) * BURROW_SPECIAL_SHARE)
      }
      return it.kind === 'truffle' && it.count === TRUFFLE_LOOT_COUNT
  }
}

describe('burrow.start', () => {
  test('Generating chunk (0, 0) places `BURROW_START_N` burrows more than `BURROW_START_R` tiles from the door; none on reserved, rock, tree or very hard tiles; no other chunk gets burrows when generated.', () => {
    const w = new World(1)
    expect(w.clock.day).toBe(1)
    expect(w.seam.kind).toBe('play')
    expect(w.burrows.size).toBe(BURROW_START_N)
    ;[...w.burrows.values()].forEach(at => {
      expect(doorR(at.col, at.row)).toBeGreaterThan(BURROW_START_R)
      expect(isReserved(at)).toBe(false)
      const c = w.cell(at)
      expect(c.kind).toBe('untilled')
      if (c.kind !== 'untilled') return
      expect(c.ground).not.toBe('very-hard')
      expect(c.cover).toEqual({ kind: 'burrow' })
      expect(chunkOf(at)).toEqual({ cx: 0, cy: 0 })
    })
    const cols = [...w.burrows.values()].map(a => `${a.col},${a.row}`)
    expect(new Set(cols).size).toBe(w.burrows.size)
    w.done.add('unlock-expand')
    w.money = 999
    w.expand({ cx: 1, cy: 0 })
    const rect = chunkRect({ cx: 1, cy: 0 })
    let n = 0
    for (let row = rect.row0; row < rect.row1; row++) {
      for (let col = rect.col0; col < rect.col1; col++) {
        const c = w.cell({ col, row })
        if (c.kind === 'untilled' && c.cover.kind === 'burrow') n += 1
      }
    }
    expect(n).toBe(0)
    expect(w.burrows.size).toBe(BURROW_START_N)
  })
})

describe('burrow.day', () => {
  test('At the end of each day each owned chunk draws once against its `burrowDayChance` and gets at most one burrow, on an untilled, not very hard, bare or grass tile that is not reserved, paved or under an item.', () => {
    const one = seedWhere(s => mints(s, START, 'start', 0))
    const w = new World(one)
    const n0 = w.burrows.size
    w.endDay()
    w.tick(DT_MAX)
    expect(w.seam.kind).toBe('play')
    expect(w.recaps).toHaveLength(1)
    expect(w.burrows.size).toBe(n0 + 1)

    const two = new World(seedWhere(s => mints(s, START, 'start', 0) && mints(s, EAST, 'other', 0)))
    two.done.add('unlock-expand')
    two.money = 999
    two.expand(EAST)
    const n1 = two.burrows.size
    two.endDay()
    two.tick(DT_MAX)
    expect(two.burrows.size).toBe(n1 + 2)

    const skip = new World(one)
    skip.forEachCell((at, c) => {
      if (c.kind === 'untilled' && c.cover.kind !== 'burrow') {
        skip.paving.set(`${at.col},${at.row}`, 'paved')
      }
    })
    const nSkip = skip.burrows.size
    skip.endDay()
    skip.tick(DT_MAX)
    expect(skip.burrows.size).toBe(nSkip)

    const grass = new World(one)
    let keep: Coord | undefined
    grass.forEachCell((at, c) => {
      if (keep !== undefined) return
      if (isReserved(at)) return
      if (onCell(grass.drops, at).length > 0) return
      if (c.kind !== 'untilled' || c.ground === 'very-hard') return
      if (c.cover.kind !== 'bare') return
      keep = at
    })
    expect(keep).toBeDefined()
    if (keep === undefined) return
    const grassAt = keep
    grass.setCell(grassAt, {
      kind: 'untilled',
      ground: 'soft',
      hardness: 0,
      cover: { kind: 'grass', variant: 0 },
    })
    grass.forEachCell((at, c) => {
      if (at.col === grassAt.col && at.row === grassAt.row) return
      if (c.kind === 'untilled' && c.cover.kind !== 'burrow') {
        grass.paving.set(`${at.col},${at.row}`, 'paved')
      }
    })
    grass.endDay()
    grass.tick(DT_MAX)
    expect(grass.cell(keep)).toEqual({ kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'burrow' } })
  })

  test('A day can pass with no new burrow: the chunk draw is compared with `burrowDayChance`.', () => {
    const seam = (seed: number) => {
      const w = new World(seed)
      const before = w.burrows.size
      while (w.clock.day === 1) w.tick(DT_MAX)
      return w.burrows.size > before
    }
    expect(seam(seedWhere(s => mints(s, START, 'start', 0)))).toBe(true)
    expect(seam(seedWhere(s => !mints(s, START, 'start', 0)))).toBe(false)
  })
})

describe('burrow.mycologist', () => {
  test('Chunk (0, 0) draws against `BURROW_DAY_CHANCE.start` + `BURROW_DAY_MYCOLOGIST.start` × Mycologist rank, every other owned chunk against `BURROW_DAY_CHANCE.other` + `BURROW_DAY_MYCOLOGIST.other` × rank: 66% and 33% at no rank, 75% and 66% at rank III.', () => {
    expect(burrowDayChance('start', 0)).toBeCloseTo(0.66)
    expect(burrowDayChance('start', 3)).toBeCloseTo(0.75)
    expect(burrowDayChance('other', 0)).toBeCloseTo(0.33)
    expect(burrowDayChance('other', 3)).toBeCloseTo(0.66)
    const seed = seedWhere(
      s => !mints(s, START, 'start', 0) && mints(s, START, 'start', 3) && !mints(s, EAST, 'other', 0) && mints(s, EAST, 'other', 3),
    )
    const run = (w: World) => {
      w.done.add('unlock-expand')
      w.money = 999
      w.expand(EAST)
      const before = w.burrows.size
      w.endDay()
      w.tick(DT_MAX)
      return w.burrows.size - before
    }
    expect(run(new World(seed))).toBe(0)
    const ranked = new World(seed)
    ranked.family.owned.set('mycologist', 3)
    expect(run(ranked)).toBe(2)
  })
})

describe('burrow.block', () => {
  test('A burrow is untilled cover and holds no item; it is walkable; placing, paving, fencing and planting a tree seed on it are refused.', () => {
    const w = new World(1)
    const at = firstBurrow(w)
    const c = w.cell(at)
    expect(c.kind).toBe('untilled')
    if (c.kind !== 'untilled') return
    expect(c.cover).toEqual({ kind: 'burrow' })
    expect(isSolid(c)).toBe(false)
    expect(placeSolidOk(w, at)).toBe(false)
    expect(isPavingSite(c)).toBe(false)
    expect(isFenceSite(c)).toBe(false)
    expect(seedPair(w, at)).toBeUndefined()
    w.seats[0].hand = { kind: 'empty' }
    w.act = w.seats[0]
    const p = readPrompt(w, at)
    expect(p.kind).toBe('intent')
    if (p.kind === 'intent') expect(p.intent).toEqual({ act: 'walk', at })
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.cell(at)).toEqual(c)
  })
})

describe('burrow.dig', () => {
  test('Any shovel digs it in work seconds × `BURROW_MUL`, one use, hardness ignored; the tile becomes bare untilled ground with the same ground and hardness; the item drops beside it; a pickaxe does nothing; the hover line does not name an item.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'untilled', ground: 'hard', hardness: 0.8, cover: { kind: 'burrow' } })
    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.act = w.seats[0]
    const prompt = readPrompt(w, AT)
    expect(prompt.kind).toBe('intent')
    if (prompt.kind === 'intent') {
      expect(prompt.text).toBe(m.prompt_dig())
      expect(prompt.intent).toEqual({ act: 'shovel', at: AT })
    }
    expect(lookText(w, { kind: 'cell', at: AT }, false)).toContain(m.names_ground_burrow())
    const predicted = digBurrow(w.rng, AT, w.clock.day, w.sinceRare)
    const slots = w.prizeSlots
    w.click(AT)
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(SHOVELS.shovel.workSeconds * BURROW_MUL)
    for (let i = 0; i < 50; i++) w.tick(DT_MAX)
    expect(w.cell(AT)).toEqual({ kind: 'untilled', ground: 'hard', hardness: 0.8, cover: { kind: 'bare' } })
    expect(onCell(w.drops, AT)).toHaveLength(0)
    const found = predicted.find
    if (found.kind === 'item') {
      expect(frontOf(AT).some(p => onCell(w.drops, p).some(d => JSON.stringify(d.item) === JSON.stringify(found.item)))).toBe(true)
    } else {
      expect(w.prizeSlots).toBe(slots + 1)
    }
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'shovel' && w.seats[0].hand.item.usesLeft).toBe(
      SHOVELS.shovel.uses - 1,
    )

    const one = new World(1)
    one.setCell(AT, { kind: 'untilled', ground: 'hard', hardness: 1, cover: { kind: 'burrow' } })
    one.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'rotary-shovel', usesLeft: 1, workSeconds: SHOVELS['rotary-shovel'].workSeconds } }
    one.seats[0].actor.x = AT.col + 0.5
    one.seats[0].actor.y = AT.row + 0.5
    one.click(AT)
    for (let i = 0; i < 50; i++) one.tick(DT_MAX)
    expect(one.cell(AT).kind).toBe('untilled')
    expect(one.seats[0].hand.kind).toBe('empty')

    const pick = new World(1)
    pick.setCell(AT, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'burrow' } })
    pick.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    pick.seats[0].actor.x = AT.col + 0.5
    pick.seats[0].actor.y = AT.row + 0.5
    pick.act = pick.seats[0]
    const blocked = readPrompt(pick, AT)
    expect(blocked.kind).toBe('blocked')
    expect(blocked.text).toBe(m.names_ground_burrow())
    pick.click(AT)
    expect(pick.seats[0].queue).toHaveLength(0)
    expect(pick.cell(AT)).toEqual({ kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'burrow' } })
  })
})

describe('burrow.rarity', () => {
  test('Uncommon = 10 + 20 × distance share + 20 × days share (32 tiles, 32 days); Rare = 1 + 5 × count + 10 × distance share + 10 × days share (32 tiles, 64 days), at most 50; Common is the rest.', () => {
    expect(burrowOdds(0, 1, 0)).toEqual({ uncommon: 10, rare: 1 })
    expect(burrowOdds(32, 33, 3)).toEqual({ uncommon: 50, rare: 31 })
    expect(burrowOdds(32, 65, 0)).toEqual({ uncommon: 50, rare: 21 })
    expect(burrowOdds(32, 65, 6)).toEqual({ uncommon: 50, rare: BURROW_RARE_MAX })
    expect(burrowOdds(80, 200, 0)).toEqual(burrowOdds(32, 65, 0))
    expect(burrowOdds(16, 17, 0)).toEqual({ uncommon: 30, rare: 8.5 })
    const max = burrowOdds(1000, 1000, 1000)
    expect(100 - max.uncommon - max.rare).toBeGreaterThanOrEqual(0)

    const odds = { uncommon: 10, rare: 1 }
    expect(rarityOf(0, odds)).toBe('rare')
    expect(rarityOf(0.0099, odds)).toBe('rare')
    expect(rarityOf(0.01, odds)).toBe('uncommon')
    expect(rarityOf(0.1099, odds)).toBe('uncommon')
    expect(rarityOf(0.11, odds)).toBe('common')
    expect(rarityOf(0.9999, { uncommon: 50, rare: 50 })).toBe('uncommon')
  })
})

describe('burrow.count', () => {
  test('A Rare dig sets the farm count to 0; a Common or Uncommon dig adds 1; the count is saved.', () => {
    const w = digger(3)
    expect(w.sinceRare).toBe(0)
    digAt(w, findTile(w, 0, d => d.rarity !== 'rare'))
    expect(w.sinceRare).toBe(1)
    digAt(w, findTile(w, 1, d => d.rarity !== 'rare'))
    expect(w.sinceRare).toBe(2)
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.sinceRare).toBe(2)
    digAt(w, findTile(w, 2, d => d.rarity === 'rare'))
    expect(w.sinceRare).toBe(0)
  })
})

describe('burrow.items', () => {
  test("Each rarity gives only its own entries; each entry's items are the listed ones; seeds and tree seeds have quality 0; the special tool has 20% of its uses; Common Treasure is 10 to 150, Uncommon 70 to 140.", () => {
    const rng = new Rng(4)
    const seen: Record<BurrowRarity, Set<string>> = { common: new Set(), uncommon: new Set(), rare: new Set() }
    ;[1, 33, 65].forEach(day =>
      [0, 10].forEach(since =>
        grid(-16, 64).forEach(at => {
          const d = digBurrow(rng, at, day, since)
          expect([d.rarity, fits(d.rarity, d)]).toEqual([d.rarity, true])
          const f = d.find
          if (f.kind === 'item' && (f.item.kind === 'seeds' || f.item.kind === 'tree-seed')) expect(f.item.quality).toBe(0)
          seen[d.rarity].add(f.kind === 'item' ? f.item.kind : f.kind)
        }),
      ),
    )
    expect([...seen.common].sort()).toEqual(['axe', 'pickaxe', 'seeds', 'shovel', 'treasure', 'tree-seed', 'weed'])
    expect([...seen.uncommon].sort()).toEqual(['fly-agaric', 'seeds', 'skill-point', 'treasure', 'tree-seed'])
    expect([...seen.rare].sort()).toEqual(['axe', 'permit', 'pickaxe', 'seeds', 'shovel', 'tree-seed', 'truffle'])
  })
})

describe('burrow.permit', () => {
  test('A Rare expansion permit adds one permit to the farm and drops nothing.', () => {
    const w = digger(5)
    w.clock.day = 65
    const at = findTile(w, 10, d => d.find.kind === 'permit')
    w.sinceRare = 10
    const slots = w.prizeSlots
    const left = w.expandLeft()
    const drops = w.drops.length
    digAt(w, at)
    expect(w.prizeSlots).toBe(slots + 1)
    expect(w.expandLeft()).toBe(left + 1)
    expect(w.drops).toHaveLength(drops)
    expect(w.sinceRare).toBe(0)
  })
})

describe('burrow.point', () => {
  test('An Uncommon skill point adds `SKILL_POINT_LOOT` skill points to the farm and drops nothing.', () => {
    const w = digger(5)
    w.clock.day = 33
    const at = findTile(w, 0, d => d.find.kind === 'skill-point')
    const points = w.points
    const drops = w.drops.length
    digAt(w, at)
    expect(w.points).toBe(points + SKILL_POINT_LOOT)
    expect(w.drops).toHaveLength(drops)
    expect(w.sinceRare).toBe(1)
  })
})

describe('burrow.truffle', () => {
  test("`{ kind: 'truffle'; count }`. Countable, composts and burns like Fly agaric, no store takes it. Only Rare burrows give it; only Uncommon burrows give Fly agaric. Each rarity has five entries. Has a name and an Almanac entry.", () => {
    const w = new World(1)
    const item = { kind: 'truffle' as const, count: 1 }
    expect('count' in item).toBe(true)
    expect(compostValue(item)).toBe(COMPOST_VALUE['fly-agaric'])
    expect(furnaceValue(item)).toBe(FURNACE_VALUE['fly-agaric'])
    expect(w.silo.accept(item)).toBe(0)
    expect(w.additives.accept(item)).toBe(0)
    expect(m.names_item_truffle().length).toBeGreaterThan(0)
    expect(catalogEntries(1).some(e => e.id === 'truffle')).toBe(true)
    expect(BURROW_RARITIES.filter(r => BURROW_ENTRIES[r].some(e => e.kind === 'truffle'))).toEqual(['rare'])
    expect(BURROW_RARITIES.filter(r => BURROW_ENTRIES[r].some(e => e.kind === 'fly-agaric'))).toEqual(['uncommon'])
    expect(BURROW_RARITIES.map(r => BURROW_ENTRIES[r].length)).toEqual([5, 5, 5])
  })
})

describe('burrow.treasure', () => {
  test("`{ kind: 'treasure'; coins }`. Not countable, not compost, not furnace, not stall, not silo. Never enters a hand: picking it up adds `coins` to `money` and removes the drop. No open intent.", () => {
    const w = new World(1)
    const coins = 12
    const item = { kind: 'treasure' as const, coins }
    expect(compostValue(item)).toBe(0)
    expect(furnaceValue(item)).toBe(0)
    expect(w.silo.accept(item)).toBe(0)
    expect(w.additives.accept(item)).toBe(0)
    expect('count' in item).toBe(false)
    w.setCell(AT, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    w.drops.push({ at: { ...AT }, item })
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.act = w.seats[0]
    const p = readPrompt(w, AT)
    expect(p.kind).toBe('intent')
    if (p.kind === 'intent') {
      expect(p.text).toBe(m.prompt_pick_up())
      expect(p.intent).toEqual({ act: 'pickup', at: AT })
    }
    const money = w.money
    w.click(AT)
    w.tick(DT_MAX)
    expect(w.money).toBe(money + coins)
    expect(w.seats[0].hand.kind).toBe('empty')
    expect(onCell(w.drops, AT).length).toBe(0)

    const full = new World(1)
    full.setCell(AT, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    full.drops.push({ at: { ...AT }, item: { kind: 'treasure', coins: 7 } })
    full.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    full.seats[0].actor.x = AT.col + 0.5
    full.seats[0].actor.y = AT.row + 0.5
    full.act = full.seats[0]
    const before = full.money
    full.click(AT)
    full.tick(DT_MAX)
    expect(full.money).toBe(before + 7)
    expect(full.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'wood', count: 1 } })

    const lying = new World(1)
    lying.setCell(AT, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    lying.drops.push({ at: { ...AT }, item: { kind: 'treasure', coins: 4 } })
    const loaded = parse(JSON.stringify(dump(lying)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(onCell(loaded.world.drops, AT)).toEqual([{ at: AT, item: { kind: 'treasure', coins: 4 } }])
  })
})
