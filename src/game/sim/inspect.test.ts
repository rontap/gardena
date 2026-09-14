// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { AXES, CONTAINERS, PICKAXES, SHOVELS, SPEECH_S } from '../defs/items.ts'
import { AdditiveStore, SeedSilo, SiloProduce, SiloSeed, SiloSpray, Pump, Well, type Coord, type RectBase } from './building.ts'
import { cellGauge } from './look.ts'
import { itemGauge, makeAxe, makeChainsaw, makeContainer, makePickaxe, makeShovel, type Item } from './item.ts'
import { bare } from './plot.ts'
import { Weed } from './plant.ts'
import { SOIL_WATER_MID, Soil, WEED_CHANCE } from './soil.ts'
import { World } from './world.ts'
import { actionText } from '../ui/status.tsx'

const AT = { col: 10, row: 12 }

function rect(): RectBase {
  return { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }
}

describe('inspect.gauge', () => {
  test('inspect.gauge - itemGauge reads usesLeft as Durability and liters as Content, against the item own maximum.', () => {
    const rows: [Item, string, number, number][] = [
      [makeShovel('shovel'), m.hud_durability(), SHOVELS.shovel.uses, SHOVELS.shovel.uses],
      [makePickaxe('pickaxe'), m.hud_durability(), PICKAXES.pickaxe.uses, PICKAXES.pickaxe.uses],
      [makeAxe(), m.hud_durability(), AXES.axe.uses, AXES.axe.uses],
      [makeChainsaw(), m.hud_durability(), AXES.chainsaw.uses, AXES.chainsaw.uses],
      [makeContainer('bucket', 2.5), m.hud_content(), 2.5, CONTAINERS.bucket.capacityLiters],
      [{ kind: 'fertilizer', liters: 12.5, capacityLiters: 30 }, m.hud_content(), 12.5, 30],
      [{ kind: 'compost', liters: 3, capacityLiters: 20 }, m.hud_content(), 3, 20],
      [{ kind: 'weed-spray', liters: 7, capacityLiters: 30 }, m.hud_content(), 7, 30],
    ]
    rows.forEach(([item, label, value, max]) => {
      expect([item.kind, itemGauge(item)]).toEqual([item.kind, { label, value, max }])
    })
    expect(itemGauge({ kind: 'wood', count: 3 })).toBeUndefined()
    expect(itemGauge({ kind: 'treasure', coins: 9 })).toBeUndefined()
    expect(itemGauge({ kind: 'sugar', liters: 9, capacityLiters: 40, unitSale: 1, quality: 0 })).toBeUndefined()
  })

  test('inspect.gauge - cellGauge reads used against cap on every Store and water.stored against capacity on a pump or a well. A plot has none.', () => {
    const silo = new SeedSilo(rect())
    silo.put('carrot', 'base', 0, 8)
    const spray = new SiloSpray(rect())
    spray.putAdditive('fertilizer', 15)
    const stores = [silo, new SiloSeed(rect()), new AdditiveStore(rect()), spray, new SiloProduce(rect())]
    stores.forEach(store => {
      expect([store.kind, cellGauge(store)]).toEqual([store.kind, { label: m.hud_content(), value: store.used, max: store.cap }])
    })
    expect(silo.used).toBe(8)
    expect(spray.used).toBe(15)
    const pump = new Pump(rect(), 'starter')
    const well = new Well(rect())
    expect(cellGauge(pump)).toEqual({ label: m.hud_content(), value: pump.water.stored, max: pump.water.capacity })
    expect(cellGauge(well)).toEqual({ label: m.hud_content(), value: well.water.stored, max: well.water.capacity })
    expect(cellGauge(bare('soft', 0))).toBeUndefined()
  })
})

describe('inspect.open', () => {
  test('inspect.open - Acts whose prompt is the thing own name read Open {name} in the action block. A verb prompt is left alone.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 9999
    const named: [Coord, string][] = []
    for (let r = 0; r < 40; r++) {
      for (let c = 0; c < 40; c++) {
        const at = { col: c, row: r }
        if (!w.inWorld(at)) continue
        const p = w.prompt(at)
        if (p.kind !== 'intent') continue
        if (!['inventory', 'chest', 'silo', 'additives', 'hangar', 'vehicle'].includes(p.intent.act)) continue
        named.push([at, p.text])
      }
    }
    expect(named.length).toBeGreaterThan(2)
    named.forEach(([at, text]) => {
      expect([at, actionText(w, w.prompt(at))]).toEqual([at, m.prompt_open({ name: text })])
    })

    w.setCell(AT, bare('soft', 0))
    w.buy('buy-research-station')
    w.confirmPlace(AT)
    expect(w.canStation(AT)).toBe(false)
    expect(actionText(w, w.prompt(AT))).toBe(m.prompt_open({ name: m.prompt_station() }))

    const weed = { col: AT.col, row: AT.row + 3 }
    w.setCell(weed, { kind: 'weed', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), weed: new Weed(0) })
    w.seats[0].hand = { kind: 'empty' }
    expect(actionText(w, w.prompt(weed))).toBe(m.prompt_pick_up())
  })
})

describe('inspect.need-tool', () => {
  test('inspect.need-tool - A blocked click on a cell with a primary act says need-a-tool off an empty hand and cannot-use off a held one.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 9999
    w.setCell(AT, bare('soft', 0))
    w.buy('buy-grinder')
    w.confirmPlace(AT)
    expect(w.cell(AT).kind).toBe('grinder')

    w.seats[0].hand = { kind: 'empty' }
    expect(w.click(AT)).toBe('blocked')
    expect(w.speech).toEqual({ kind: 'say', text: m.prompt_need_tool({ action: m.prompt_grind() }), left: SPEECH_S })

    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    expect(w.click(AT)).toBe('blocked')
    expect(w.speech).toEqual({
      kind: 'say',
      text: m.prompt_cannot_use({ tool: m.names_shovel_shovel(), action: m.prompt_grind() }),
      left: SPEECH_S,
    })
  })
})
