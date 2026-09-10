import { describe, expect, test } from 'vitest'
import { m } from '../../../paraglide/messages.js'
import {
  BURROW_DAY_CHANCE,
  BURROW_LUCK_CHANCE,
  BURROW_START_N,
  BURROW_START_R,
  BURROW_MUL,
  LOOT_GATE_AGARIC,
  LOOT_GATE_BASE,
  LOOT_GATE_FERT,
  LOOT_GATE_HEIRLOOM,
  LOOT_GATE_TOOL,
  LOOT_GATE_VARIANT,
  LOOT_GATE_WEED,
  LOOT_LUCK_DIV,
  LOOT_ROLL_BASE,
  LOOT_ROLL_DAY,
  LOOT_ROLL_DAY_SPAN,
  LOOT_ROLL_DIST,
  LOOT_ROLL_DIST_R,
  LOOT_U_OFF,
  LOOT_U_SPAN,
  LUCK_CAP,
} from '../../defs/burrow.ts'
import { AXES, FERT_BAG_LITERS, PICKAXES, SHOVELS } from '../../defs/items.ts'
import { catalogEntries } from '../../defs/catalog.ts'
import { chunkOf, chunkRect, frontOf, isReserved } from '../building.ts'
import { onCell } from '../drop.ts'
import { luckOf } from '../family.ts'
import { BURROW_DAY_SALT } from './burrow.ts'
import { dump, parse } from '../feature-save/save.ts'
import { seedPair } from '../feature-field/field.helpers.ts'
import { compostValue, furnaceValue, makePickaxe, makeShovel, toolName } from '../item.ts'
import { lookText } from '../look.ts'
import { isFenceSite, isSolid, isPavingSite } from '../plot.ts'
import { placeSolidOk, readPrompt } from '../prompt.ts'
import { Rng } from '../rng.ts'
import { DT_MAX, World } from '../world.ts'
import { burrowDayChance, doorR, keptRows, lootRoll, rollLoot, type LootRowId } from './burrow.ts'

const AT = { col: 10, row: 12 }

function firstBurrow(w: World) {
  return [...w.burrows.values()][0]
}

describe('burrow.start', () => {
  test('Chunk `(0,0)` generate mints `BURROW_START_N` with Euclidean `r` from door `> 8` (same `r` as `clearBase`). None on reserved / rock / tree / very-hard. Day-1 generate does not also seam-spawn. Expand generate mints 0.', () => {
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
      expect(c.cover.kind).toBe('burrow')
      if (c.cover.kind === 'burrow') expect(c.cover.loot).toBeDefined()
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
  test('Seam, after stipend and tax, before field tick: `+1` per owned chunk on an eligible cell, or skip if none. Eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop. Grass cover is replaced.', () => {
    const w = new World(2)
    const n0 = w.burrows.size
    w.endDay()
    w.tick(DT_MAX)
    expect(w.seam.kind).toBe('play')
    expect(w.recaps).toHaveLength(1)
    expect(w.burrows.size).toBe(n0 + 1)

    const two = new World(2)
    two.done.add('unlock-expand')
    two.money = 999
    two.expand({ cx: 1, cy: 0 })
    const n1 = two.burrows.size
    two.endDay()
    two.tick(DT_MAX)
    expect(two.burrows.size).toBe(n1 + 2)

    const skip = new World(2)
    skip.forEachCell((at, c) => {
      if (c.kind === 'untilled' && c.cover.kind !== 'burrow') {
        skip.paving.set(`${at.col},${at.row}`, 'paved')
      }
    })
    const nSkip = skip.burrows.size
    skip.endDay()
    skip.tick(DT_MAX)
    expect(skip.burrows.size).toBe(nSkip)

    const grass = new World(2)
    let keep: { col: number; row: number } | undefined
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
    const grew = grass.cell(keep)
    expect(grew.kind === 'untilled' && grew.cover.kind === 'burrow').toBe(true)
  })
})

describe('burrow.block', () => {
  test("Burrow is untilled cover `{ kind: 'burrow'; loot }`, loot required. Not solid. Walk ok. Place / tile / fence / tree-seed refuse.", () => {
    const w = new World(1)
    const at = firstBurrow(w)
    const c = w.cell(at)
    expect(c.kind).toBe('untilled')
    if (c.kind !== 'untilled') return
    expect(c.cover.kind).toBe('burrow')
    if (c.cover.kind !== 'burrow') return
    expect(c.cover.loot.kind).toBeDefined()
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
    const saved = dump(w)
    const loaded = parse(JSON.stringify(saved))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const again = loaded.world.cell(at)
    expect(again.kind === 'untilled' && again.cover.kind === 'burrow').toBe(true)
    if (again.kind === 'untilled' && again.cover.kind === 'burrow') {
      expect(again.cover.loot).toEqual(c.cover.loot)
    }
  })
})

describe('burrow.dig', () => {
  test('Shovel extract: work `workSeconds × BURROW_MUL`, not hardness, 1 use, any shovel id, does not till. Cover → bare, same `ground` / `hardness`. Drop stored item on the cell. Prompt **Dig**. Pickaxe no-op. Inspect does not name loot.', () => {
    const w = new World(1)
    const loot = { kind: 'treasure' as const, coins: 9 }
    const named = {
      kind: 'seeds' as const,
      crop: 'tomato' as const,
      variety: 'base' as const,
      quality: 0,
      count: 3,
    }
    w.setCell(AT, { kind: 'untilled', ground: 'hard', hardness: 0.8, cover: { kind: 'burrow', loot: named } })
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
    const look = lookText(w, { kind: 'cell', at: AT }, false)
    expect(look).toContain(m.names_ground_burrow())
    expect(look).not.toContain(m.names_crop_tomato())
    expect(look).not.toContain(toolName({ kind: 'hold', item: named }))
    w.setCell(AT, { kind: 'untilled', ground: 'hard', hardness: 0.8, cover: { kind: 'burrow', loot } })
    w.click(AT)
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(SHOVELS.shovel.workSeconds * BURROW_MUL)
    expect(w.seats[0].workTotal).not.toBe(SHOVELS.shovel.workSeconds)
    for (let i = 0; i < 50; i++) w.tick(DT_MAX)
    const after = w.cell(AT)
    expect(after).toEqual({ kind: 'untilled', ground: 'hard', hardness: 0.8, cover: { kind: 'bare' } })
    expect(onCell(w.drops, AT).some(d => d.item.kind === 'treasure')).toBe(false)
    expect(frontOf(AT).some(p => onCell(w.drops, p).some(d => d.item.kind === 'treasure' && d.item.coins === 9))).toBe(
      true,
    )
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'shovel' && w.seats[0].hand.item.usesLeft).toBe(
      SHOVELS.shovel.uses - 1,
    )

    const one = new World(1)
    one.setCell(AT, { kind: 'untilled', ground: 'hard', hardness: 1, cover: { kind: 'burrow', loot } })
    one.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'rotary-shovel', usesLeft: 1, workSeconds: SHOVELS['rotary-shovel'].workSeconds } }
    one.seats[0].actor.x = AT.col + 0.5
    one.seats[0].actor.y = AT.row + 0.5
    one.click(AT)
    for (let i = 0; i < 50; i++) one.tick(DT_MAX)
    expect(one.cell(AT).kind).toBe('untilled')
    expect(one.seats[0].hand.kind).toBe('empty')

    const pick = new World(1)
    pick.setCell(AT, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'burrow', loot } })
    pick.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    pick.seats[0].actor.x = AT.col + 0.5
    pick.seats[0].actor.y = AT.row + 0.5
    pick.act = pick.seats[0]
    const blocked = readPrompt(pick, AT)
    expect(blocked.kind).toBe('blocked')
    expect(blocked.text).toBe(m.names_ground_burrow())
    pick.click(AT)
    expect(pick.seats[0].queue).toHaveLength(0)
    const still = pick.cell(AT)
    expect(still.kind === 'untilled' && still.cover.kind === 'burrow').toBe(true)
  })
})

describe('burrow.loot', () => {
  test('`lootRoll` as `defs/burrow.ts`. Nine rows, filter by gate + non-empty pool, then equal chance. Treasure always. Second roll uniform in that row\'s listed pool. Quality 0. Spatial `burrow.at(col, row, salt)`. Stored at spawn.', () => {
    const u = 0.5
    const r = 8
    const day = 1
    const luck = 0
    expect(lootRoll(u, r, day, luck)).toBe(
      LOOT_ROLL_BASE +
        LOOT_ROLL_DIST * Math.min(1, r / LOOT_ROLL_DIST_R) +
        LOOT_ROLL_DAY * Math.min(1, (day - 1) / LOOT_ROLL_DAY_SPAN) +
        luck / LOOT_LUCK_DIV +
        u * LOOT_U_SPAN -
        LOOT_U_OFF,
    )
    const w = new World(1)
    const at = firstBurrow(w)
    const c = w.cell(at)
    expect(c.kind === 'untilled' && c.cover.kind === 'burrow').toBe(true)
    if (c.kind !== 'untilled' || c.cover.kind !== 'burrow') return
    expect(rollLoot(new Rng(1), at.col, at.row, 1, 0)).toEqual(c.cover.loot)
    if (c.cover.loot.kind === 'seeds' || c.cover.loot.kind === 'tree-seed') expect(c.cover.loot.quality).toBe(0)
    if (c.cover.loot.kind === 'shovel') {
      expect(c.cover.loot.id).toBe('better-shovel')
      expect(c.cover.loot.workSeconds).toBe(SHOVELS['better-shovel'].workSeconds)
    }
    if (c.cover.loot.kind === 'pickaxe') {
      expect(c.cover.loot.id).toBe('better-pickaxe')
      expect(c.cover.loot.workSeconds).toBe(PICKAXES['better-pickaxe'].workSeconds)
    }
    if (c.cover.loot.kind === 'axe') expect(c.cover.loot.workSeconds).toBe(AXES.axe.workSeconds)
    if (c.cover.loot.kind === 'fertilizer') expect(c.cover.loot.liters).toBe(FERT_BAG_LITERS)
    w.family.player.owned.set('lucky', LUCK_CAP)
    const later = w.cell(at)
    expect(later.kind === 'untilled' && later.cover.kind === 'burrow' && later.cover.loot).toEqual(c.cover.loot)

    const far = rollLoot(new Rng(2), 30, 30, 40, LUCK_CAP)
    const farU = new Rng(2).stream('burrow').at(30, 30, 0)
    const farRoll = lootRoll(farU, doorR(30, 30), 40, LUCK_CAP)
    expect(farRoll).toBeGreaterThan(LOOT_GATE_HEIRLOOM)
    if (far.kind === 'seeds' || far.kind === 'tree-seed') expect(far.quality).toBe(0)

    const near = lootRoll(0, BURROW_START_R + 0.1, 1, 0)
    expect(near).toBeLessThan(LOOT_GATE_BASE)
    expect(LOOT_GATE_WEED).toBeLessThanOrEqual(LOOT_GATE_FERT)
    expect(LOOT_GATE_FERT).toBeLessThan(LOOT_GATE_TOOL)
    expect(LOOT_GATE_TOOL).toBeLessThan(LOOT_GATE_VARIANT)
    expect(LOOT_GATE_VARIANT).toBeLessThan(LOOT_GATE_BASE)
    expect(LOOT_GATE_HEIRLOOM).toBe(LOOT_GATE_BASE)
    expect(LOOT_GATE_AGARIC).toBe(LOOT_GATE_HEIRLOOM)
  })

  test('burrow.bands - Five bands. Treasure in every one. Fertilizer and Pulled weed at the bottom, tool above them, base rows until the heirloom gate, variant rows from the variant gate, heirloom rows and Fly agaric from the top gate. Vanilla is not a burrow seed.', () => {
    const bands: [number, LootRowId[]][] = [
      [1, ['treasure', 'tree-seed-base', 'fertilizer', 'tool', 'weed', 'seeds-base']],
      [2, ['treasure', 'tree-seed-base', 'tool', 'seeds-base']],
      [3, ['treasure', 'tree-seed-base', 'seeds-base']],
      [4, ['treasure', 'tree-seed-base', 'tree-seed-variant', 'seeds-base', 'seeds-variant']],
      [5, ['treasure', 'tree-seed-variant', 'tree-seed-heirloom', 'fly-agaric', 'seeds-variant', 'seeds-heirloom']],
      [9, ['treasure', 'tree-seed-variant', 'tree-seed-heirloom', 'fly-agaric', 'seeds-variant', 'seeds-heirloom']],
    ]
    bands.forEach(([roll, rows]) => {
      expect([roll, keptRows(roll).slice().sort()]).toEqual([roll, rows.slice().sort()])
    })
    for (let roll = 0; roll <= 10; roll += 0.25) expect(keptRows(roll)).toContain('treasure')
    const seen = new Set<string>()
    for (let col = 0; col < 60; col++) {
      for (let row = 0; row < 60; row++) {
        const loot = rollLoot(new Rng(3), col, row, 20, 3)
        if (loot.kind === 'seeds') seen.add(loot.crop)
      }
    }
    expect(seen.has('tomato') || seen.has('raspberry') || seen.has('grape')).toBe(true)
    expect([...seen].every(c => c === 'tomato' || c === 'raspberry' || c === 'grape')).toBe(true)
  })

  test('burrow.day-chance - Each owned chunk mints on a `BURROW_DAY_CHANCE + luck x BURROW_LUCK_CHANCE` roll, so a day can pass with no new burrow. Luck raises the chance and caps below certainty.', () => {
    expect(burrowDayChance(0)).toBe(BURROW_DAY_CHANCE)
    expect(burrowDayChance(3)).toBeCloseTo(BURROW_DAY_CHANCE + 3 * BURROW_LUCK_CHANCE, 10)
    expect(burrowDayChance(3)).toBeGreaterThan(burrowDayChance(0))
    expect(burrowDayChance(LUCK_CAP)).toBeLessThan(1)

    const rolls = Array.from({ length: 60 }, (_, i) => {
      const seed = i + 1
      const w = new World(seed)
      const id = w.owned[0]
      return { seed, mints: w.rng.stream('burrow').at(id.cx, id.cy, 2, BURROW_DAY_SALT) < burrowDayChance(0) }
    })
    const mints = rolls.find(r => r.mints)
    const skips = rolls.find(r => !r.mints)
    if (mints === undefined || skips === undefined) throw new Error('seed')

    const seam = (seed: number) => {
      const w = new World(seed)
      const before = w.burrows.size
      while (w.clock.day === 1) w.tick(DT_MAX)
      return w.burrows.size > before
    }
    expect(seam(mints.seed)).toBe(true)
    expect(seam(skips.seed)).toBe(false)
  })
})

describe('burrow.agaric', () => {
  test("burrow.agaric - `{ kind: 'fly-agaric'; count }`. Countable, stacks like Ash, no compost value, no furnace value, no store takes it. Top band only. Has a name and an Almanac entry.", () => {
    const w = new World(1)
    const item = { kind: 'fly-agaric' as const, count: 1 }
    expect('count' in item).toBe(true)
    expect(compostValue(item)).toBe(0)
    expect(furnaceValue(item)).toBe(0)
    expect(w.silo.accept(item)).toBe(0)
    expect(w.additives.accept(item)).toBe(0)
    expect(m.names_item_fly_agaric().length).toBeGreaterThan(0)
    expect(catalogEntries().some(e => e.id === 'fly-agaric')).toBe(true)
    expect(keptRows(LOOT_GATE_AGARIC)).toContain('fly-agaric')
    expect(keptRows(LOOT_GATE_AGARIC - 0.01)).not.toContain('fly-agaric')
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
    const snap = dump(lying)
    const loaded = parse(JSON.stringify(snap))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(onCell(loaded.world.drops, AT)).toEqual([{ at: AT, item: { kind: 'treasure', coins: 4 } }])
  })
})

describe('family.lucky', () => {
  test("One `lucky` per member, each maxTier 1. Luck is `min(LUCK_CAP, the three tiers summed)`. Not a World field. No HUD chip.", () => {
    const w = new World(1)
    expect('luck' in w).toBe(false)
    expect(luckOf(w)).toBe(0)
    w.unlockAllSkills()
    expect(w.skillTier('lucky')).toBe(1)
    expect(w.skillTier('lucky-husband')).toBe(1)
    expect(w.skillTier('lucky-daughter')).toBe(1)
    expect(luckOf(w)).toBe(LUCK_CAP < 3 ? LUCK_CAP : 3)
  })
})
