import { describe, expect, test } from 'vitest'
import { catalogEntries } from '../defs/catalog.ts'
import {
  EARLY_FRUIT,
  GRANDMA_DAY,
  NECRO_AGARIC,
  NECRO_ASH,
  NECRO_COST,
  NECRO_CROP,
  NECRO_GOLD,
  NECRO_H,
  NECRO_SECONDS,
  NECRO_W,
  PAGES,
  PAGE_IDS,
  SUPPER,
  pageWant,
} from '../defs/necronomicon.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { SHELF_SKUS } from '../defs/shelf.ts'
import { Necronomicon, occupiedCells } from './building.ts'
import { bare } from './plot.ts'
import { DAY_SECONDS } from './clock.ts'
import { isIoCell, IO_SKUS } from './feature-machines/machine.ts'
import { pullMachineStores } from './feature-machines/machines.tick.ts'
import {
  advanceGrandma,
  grandmaAt,
  pageClaim,
  pageFilled,
  pageOpen,
  pagesHidden,
  pageStates,
  ritualBody,
  ritualReady,
  sacrificeGoldBody,
} from './feature-necronomicon/necronomicon.ts'
import { dump, parse } from './feature-save/save.ts'
import { GRANDMA_IDS } from './ids.ts'
import { makePickaxe, makeShovel, skuItem, type Item } from './item.ts'
import { NOTICE_ORDER, noticeRows } from '../ui/notices.ts'
import { World } from './world.ts'

const AT = { col: 10, row: 12 }

type Fruit = Extract<Item, { kind: 'fruit' }>

function fruit(crop: 'carrot' | 'potato' | 'wheat' | 'tomato' | 'raspberry' | 'grape' | 'apple', count: number): Fruit {
  return { kind: 'fruit', crop, variety: 'base', quality: 0.5, count, unitSale: 1, freshness: 1, cut: false }
}

function farm(): { w: World; book: Necronomicon } {
  const w = new World(1)
  const book = new Necronomicon({ shape: 'rect', col: AT.col, row: AT.row, w: NECRO_W, h: NECRO_H })
  occupiedCells(book.base, w.owned).forEach(p => w.setCell(p, book))
  w.necronomicon = book
  w.seats[0].actor.x = AT.col + 0.5
  w.seats[0].actor.y = AT.row + 0.5
  return { w, book }
}

describe('necronomicon.research', () => {
  test('`unlock-necronomicon` parent is `unlock-grinder`; known and open only after `World.grandma` is `told` and that parent is in `done`; until then mystery; no other research row reads `grandma`.', () => {
    expect(RESEARCH['unlock-necronomicon']).toMatchObject({
      path: 'unlock-grinder',
      parent: 'unlock-grinder',
      cost: NECRO_COST,
      seconds: NECRO_SECONDS,
      effect: { kind: 'unlock-sku', sku: 'buy-necronomicon' },
    })
    const w = new World(1)
    expect(w.grandma).toBe('well')
    expect(w.researchKnown('unlock-necronomicon')).toBe(false)
    expect(w.researchOpen('unlock-necronomicon')).toBe(false)
    w.grandma = 'gone'
    expect(w.researchKnown('unlock-necronomicon')).toBe(false)
    w.grandma = 'told'
    expect(w.researchKnown('unlock-necronomicon')).toBe(false)
    expect(w.researchOpen('unlock-necronomicon')).toBe(false)
    w.done.add('unlock-grinder')
    expect(w.researchKnown('unlock-necronomicon')).toBe(true)
    expect(w.researchOpen('unlock-necronomicon')).toBe(true)
    const others = Object.keys(RESEARCH).filter(id => id !== 'unlock-necronomicon')
    const shownWell = new World(1)
    others.forEach(id => {
      const before = shownWell.researchKnown(id as keyof typeof RESEARCH)
      shownWell.grandma = 'told'
      expect(shownWell.researchKnown(id as keyof typeof RESEARCH)).toBe(before)
      shownWell.grandma = 'well'
    })
  })

  test('`buy-necronomicon` is an Automation SKU behind `unlock-necronomicon`, sits on a Build shelf, and has an almanac entry.', () => {
    expect(SKUS['buy-necronomicon']).toMatchObject({
      tab: 'automation',
      unlock: 'unlock-necronomicon',
      show: 'unlock-necronomicon',
      need: [],
    })
    expect(SHELF_SKUS).toContain('buy-necronomicon')
    expect(skuItem('buy-necronomicon')).toEqual({ kind: 'necronomicon' })
    expect(catalogEntries().some(e => e.id === 'necronomicon')).toBe(true)
  })
})

describe('necronomicon.grandma', () => {
  test('`grandmaAt` steps well → ill → care → gone → told on `GRANDMA_DAY`. `advanceGrandma` only moves forward and pushes every beat it passes onto `grandmaUnseen`, so a skipped day still posts its letter.', () => {
    expect(grandmaAt(0)).toBe('well')
    expect(grandmaAt(GRANDMA_DAY.ill - 1)).toBe('well')
    expect(grandmaAt(GRANDMA_DAY.ill)).toBe('ill')
    expect(grandmaAt(GRANDMA_DAY.care)).toBe('care')
    expect(grandmaAt(GRANDMA_DAY.gone)).toBe('gone')
    expect(grandmaAt(GRANDMA_DAY.told)).toBe('told')
    expect(grandmaAt(GRANDMA_DAY.told + 50)).toBe('told')

    const w = new World(1)
    advanceGrandma(w, GRANDMA_DAY.ill)
    expect(w.grandma).toBe('ill')
    expect(w.grandmaUnseen).toEqual(['ill'])
    advanceGrandma(w, GRANDMA_DAY.ill)
    expect(w.grandmaUnseen).toEqual(['ill'])
    advanceGrandma(w, GRANDMA_DAY.told)
    expect(w.grandma).toBe('told')
    expect(w.grandmaUnseen).toEqual(['ill', 'care', 'gone', 'told'])
    w.seeGrandma('care')
    expect(w.grandmaUnseen).toEqual(['ill', 'gone', 'told'])
    w.seeGrandma('care')
    expect(w.grandmaUnseen).toEqual(['ill', 'gone', 'told'])
  })

  test('The seam advances the beat off the ended day, and an unseen beat is one `grandma` notice that skips the two-pass delay. `NOTICE_ORDER` still starts with `recap`.', () => {
    const w = new World(1)
    w.clock.day = GRANDMA_DAY.ill
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(0.002)
    expect(w.grandma).toBe('ill')
    const rows = noticeRows(w).filter(r => r.kind === 'grandma')
    expect(rows).toHaveLength(1)
    expect(rows[0].go).toEqual({ kind: 'popup', popup: { kind: 'grandma', beat: 'ill' } })
    expect(rows[0].bar).toBeUndefined()
    expect(NOTICE_ORDER[0]).toBe('recap')
    expect(NOTICE_ORDER).toContain('grandma')
  })
})

describe('necronomicon.pages', () => {
  test('Seven pages. `crop` and `early-fruit` are open from the start; `agaric`, `ash` and `gold` need two pages done, `ash` also needs the furnace, `tool` needs three and `supper` four. A shut page is not in `pageStates` and `pagesHidden` says so.', () => {
    expect(PAGE_IDS).toEqual(['crop', 'early-fruit', 'agaric', 'ash', 'gold', 'tool', 'supper'])
    expect(pageWant('crop')).toBe(NECRO_CROP)
    expect(pageWant('early-fruit')).toBe(EARLY_FRUIT.length)
    expect(pageWant('ash')).toBe(NECRO_ASH)
    expect(pageWant('gold')).toBe(NECRO_GOLD)
    expect(pageWant('agaric')).toBe(NECRO_AGARIC)
    expect(pageWant('tool')).toBe(1)
    expect(pageWant('supper')).toBe(SUPPER.length)
    expect(PAGES.ash.lock).toEqual({ pages: 2, research: ['unlock-furnace'] })
    expect(PAGES.gold.lock).toEqual({ pages: 2, research: [] })
    expect(PAGES.agaric.lock).toEqual({ pages: 2, research: [] })
    expect(PAGES.tool.lock).toEqual({ pages: 3, research: [] })
    expect(PAGES.supper.lock).toEqual({ pages: 4, research: [] })

    const { w, book } = farm()
    expect(pageStates(w, book).map(p => p.id)).toEqual(['crop', 'early-fruit'])
    expect(pagesHidden(w, book)).toBe(true)

    book.done.push('crop', 'early-fruit')
    expect(pageOpen(w, book, 'gold')).toBe(true)
    expect(pageOpen(w, book, 'agaric')).toBe(true)
    expect(pageOpen(w, book, 'ash')).toBe(false)
    expect(pageOpen(w, book, 'tool')).toBe(false)
    w.done.add('unlock-furnace')
    expect(pageOpen(w, book, 'ash')).toBe(true)
    expect(pagesHidden(w, book)).toBe(true)
    book.done.push('agaric')
    expect(pageOpen(w, book, 'tool')).toBe(true)
    expect(pageOpen(w, book, 'supper')).toBe(false)
    book.done.push('ash')
    expect(pageOpen(w, book, 'supper')).toBe(true)
    expect(pagesHidden(w, book)).toBe(false)
  })

  test('The `crop` page locks onto the first crop sacrificed and refuses every other crop after. It counts to `NECRO_CROP` and takes no more.', () => {
    const { book } = farm()
    book.done.push('early-fruit')
    expect(book.accept(fruit('apple', 5))).toBe(5)
    book.apply(fruit('apple', 5), 5)
    expect(book.crop).toBe('apple')
    expect(pageFilled(book, 'crop')).toBe(5)
    expect(book.accept(fruit('potato', 5))).toBe(0)
    expect(book.accept(fruit('apple', NECRO_CROP))).toBe(NECRO_CROP - 5)
    book.apply(fruit('apple', NECRO_CROP), NECRO_CROP - 5)
    expect(pageFilled(book, 'crop')).toBe(NECRO_CROP)
    expect(book.accept(fruit('apple', 1))).toBe(0)
  })

  test('The `early-fruit` page takes one of each of the six starting crops and never a second of the same one. It claims ahead of the bulk page, one unit at a time, and a crop it does not want falls through to the bulk page.', () => {
    const { w, book } = farm()
    expect(pageClaim(book, fruit('carrot', 10))).toEqual({ page: 'early-fruit', n: 1, crop: 'carrot' })
    book.apply(fruit('carrot', 10), 1)
    expect(book.fruit).toEqual(['carrot'])
    expect(pageFilled(book, 'early-fruit')).toBe(1)
    expect(pageClaim(book, fruit('carrot', 9))).toEqual({ page: 'crop', n: 9, crop: 'carrot' })
    expect(pageClaim(book, fruit('apple', 3))).toEqual({ page: 'crop', n: 3, crop: 'apple' })
    EARLY_FRUIT.filter(c => c !== 'carrot').forEach(c => {
      const it = fruit(c as 'potato', 1)
      book.apply(it, book.accept(it))
    })
    expect(pageFilled(book, 'early-fruit')).toBe(EARLY_FRUIT.length)
    expect(pageStates(w, book).find(p => p.id === 'early-fruit')?.have).toBe(EARLY_FRUIT.length)
  })

  test('Cut fruit is never a sacrifice, and neither is any item no page asks for.', () => {
    const { book } = farm()
    expect(book.accept({ ...fruit('carrot', 3), cut: true })).toBe(0)
    expect(book.accept({ kind: 'wood', count: 9 })).toBe(0)
    expect(book.accept({ kind: 'treasure', coins: 99 })).toBe(0)
    expect(book.accept(makeShovel('better-shovel'))).toBe(0)
    expect(book.accept(makePickaxe('better-pickaxe'))).toBe(0)
    expect(book.accept({ kind: 'flour', quality: 0, count: 2, unitSale: 1 })).toBe(0)
  })

  test('The `agaric` page takes `NECRO_AGARIC` Fly agaric and nothing else takes them.', () => {
    const { book } = farm()
    expect(pageClaim(book, { kind: 'fly-agaric', count: 1 })).toEqual({ page: 'agaric', n: 1 })
    book.apply({ kind: 'fly-agaric', count: 1 }, 1)
    expect(book.agaric).toBe(1)
    expect(book.accept({ kind: 'fly-agaric', count: NECRO_AGARIC })).toBe(NECRO_AGARIC - 1)
    book.apply({ kind: 'fly-agaric', count: NECRO_AGARIC }, NECRO_AGARIC - 1)
    expect(pageFilled(book, 'agaric')).toBe(NECRO_AGARIC)
    expect(book.accept({ kind: 'fly-agaric', count: 1 })).toBe(0)
  })

  test('The `tool` page takes one Rotary shovel or one Diamond pickaxe, whichever comes first, and refuses the other after. A starter or better tool is never a sacrifice.', () => {
    const { book } = farm()
    expect(book.accept(makeShovel('shovel'))).toBe(0)
    expect(book.accept(makePickaxe('pickaxe'))).toBe(0)
    expect(pageClaim(book, makePickaxe('diamond-pickaxe'))).toEqual({ page: 'tool', n: 1 })
    expect(pageClaim(book, makeShovel('rotary-shovel'))).toEqual({ page: 'tool', n: 1 })
    book.apply(makeShovel('rotary-shovel'), 1)
    expect(book.tool).toBe(true)
    expect(pageFilled(book, 'tool')).toBe(1)
    expect(book.accept(makePickaxe('diamond-pickaxe'))).toBe(0)
  })

  test('The `supper` page takes one Barackpalinka, one Premium wine and one Bread, one of each and never a second. Any other spirit or cask falls through.', () => {
    const { book } = farm()
    const palinka: Item = { kind: 'spirit', spirit: 'brandy', variety: 'klosterneuburger', quality: 0, count: 2, unitSale: 1, infused: false }
    const wine: Item = { kind: 'cask', cask: 'wine', variety: 'keknyelu', quality: 0, count: 1, unitSale: 1, infused: false }
    const bread: Item = { kind: 'bread', quality: 0, count: 4, unitSale: 1 }
    const vodka: Item = { kind: 'spirit', spirit: 'vodka', variety: 'base', quality: 0, count: 1, unitSale: 1, infused: false }
    const cider: Item = { kind: 'cask', cask: 'cider', variety: 'base', quality: 0, count: 1, unitSale: 1, infused: false }
    expect(book.accept(vodka)).toBe(0)
    expect(book.accept(cider)).toBe(0)
    expect(pageClaim(book, palinka)).toEqual({ page: 'supper', n: 1, good: 'palinka' })
    book.apply(palinka, 1)
    expect(book.accept(palinka)).toBe(0)
    expect(pageClaim(book, wine)).toEqual({ page: 'supper', n: 1, good: 'wine' })
    book.apply(wine, 1)
    expect(pageClaim(book, bread)).toEqual({ page: 'supper', n: 1, good: 'bread' })
    book.apply(bread, 1)
    expect(book.supper).toEqual(['palinka', 'wine', 'bread'])
    expect(pageFilled(book, 'supper')).toBe(SUPPER.length)
    expect(book.accept(bread)).toBe(0)
  })

  test('The `ash` page takes ash only while it is open, counts to `NECRO_ASH`, and a shut page takes nothing.', () => {
    const { w, book } = farm()
    const ash: Item = { kind: 'ash', count: 30 }
    expect(pageClaim(book, ash)).toEqual({ page: 'ash', n: 30 })
    expect(book.accept(ash)).toBe(30)
    book.done.push('crop', 'early-fruit')
    w.done.add('unlock-furnace')
    book.apply(ash, 30)
    expect(book.ash).toBe(30)
    expect(book.accept({ kind: 'ash', count: NECRO_ASH })).toBe(NECRO_ASH - 30)
  })
})

describe('necronomicon.sacrifice', () => {
  test('A chest west of the book feeds it: the book is an `IoCell` and `buy-necronomicon` an `IO_SKU`, so `pullMachineStores` empties that chest into the open page.', () => {
    const { w, book } = farm()
    expect(isIoCell(book)).toBe(true)
    expect(IO_SKUS).toContain('buy-necronomicon')
    const west = { col: book.base.col - 1, row: book.base.row + book.base.h - 1 }
    w.money = 9999
    w.setCell(west, bare('soft', 0))
    w.buy('buy-chest')
    w.confirmPlace(west)
    const chest = w.cell(west)
    if (chest.kind !== 'chest') throw new Error('chest')
    chest.slots[0] = { kind: 'hold', item: { kind: 'ash', count: 12 } }
    pullMachineStores(w)
    expect(book.ash).toBe(12)
    expect(chest.slots[0]).toEqual({ kind: 'empty' })
  })

  test('`sacrificeGoldBody` spends `NECRO_GOLD` only when the page is open and the farm can pay it. It never part-pays and never runs twice.', () => {
    const { w, book } = farm()
    w.money = NECRO_GOLD * 2
    sacrificeGoldBody(w)
    expect(book.gold).toBe(0)
    expect(w.money).toBe(NECRO_GOLD * 2)

    book.done.push('crop', 'early-fruit')
    w.money = NECRO_GOLD - 1
    sacrificeGoldBody(w)
    expect(book.gold).toBe(0)
    expect(w.money).toBe(NECRO_GOLD - 1)

    w.money = NECRO_GOLD
    sacrificeGoldBody(w)
    expect(book.gold).toBe(NECRO_GOLD)
    expect(w.money).toBe(0)

    w.money = NECRO_GOLD
    sacrificeGoldBody(w)
    expect(w.money).toBe(NECRO_GOLD)
  })
})

describe('necronomicon.ritual', () => {
  test('The ritual only runs at twilight, closes every open page that is full in one go, and leaves a page short of its amount alone. A closed page stops taking sacrifices.', () => {
    const { w, book } = farm()
    book.cropCount = NECRO_CROP
    book.apply(fruit('carrot', 1), 1)
    expect(ritualReady(w, book)).toBe(true)

    w.clock.t = 0
    expect(w.clock.phase()).not.toBe('twilight')
    ritualBody(w)
    expect(book.done).toEqual([])

    w.clock.t = DAY_SECONDS * 0.95
    expect(w.clock.phase()).toBe('twilight')
    ritualBody(w)
    expect(book.done).toEqual(['crop'])
    expect(ritualReady(w, book)).toBe(false)
    expect(book.accept(fruit('carrot', 1))).toBe(0)
  })

  test('Closing the first two pages at one ritual opens `gold` at that same ritual, and the ritual is a no-op when nothing is full.', () => {
    const { w, book } = farm()
    w.clock.t = DAY_SECONDS * 0.95
    book.cropCount = NECRO_CROP
    EARLY_FRUIT.forEach(c => book.fruit.push(c))
    ritualBody(w)
    expect(book.done).toEqual(['crop', 'early-fruit'])
    expect(pageOpen(w, book, 'gold')).toBe(true)
    ritualBody(w)
    expect(book.done).toEqual(['crop', 'early-fruit'])
  })

  test('A book with a full page raises one `necronomicon` notice carrying its own cells, and none while nothing is ready.', () => {
    const { w, book } = farm()
    expect(noticeRows(w).filter(r => r.kind === 'necronomicon')).toHaveLength(0)
    book.cropCount = NECRO_CROP
    const rows = noticeRows(w).filter(r => r.kind === 'necronomicon')
    expect(rows).toHaveLength(1)
    expect(rows[0].cells).toHaveLength(NECRO_W * NECRO_H)
  })
})

describe('necronomicon.one', () => {
  test('One book per farm: the shelf stops offering it and a second buy is refused while one stands. It cannot be demolished, and Demolish leaves its cells alone.', () => {
    const { w, book } = farm()
    const other = { col: AT.col + 6, row: AT.row }
    w.money = 9999
    w.done.add('unlock-necronomicon')
    for (let row = -1; row <= NECRO_H; row++) {
      for (let col = -1; col <= NECRO_W; col++) w.setCell({ col: other.col + col, row: other.row + row }, bare('soft', 0))
    }
    expect(w.skuShown('buy-necronomicon')).toBe(false)
    expect(w.skuOpen('buy-necronomicon')).toBe(false)
    w.buy('buy-necronomicon')
    expect(w.act.place.kind).toBe('none')
    w.confirmPlace(other)
    expect(w.cell(other).kind).not.toBe('necronomicon')
    expect(w.necronomicon).toBe(book)

    w.armDelete()
    w.click(AT)
    expect(w.cell(AT).kind).toBe('necronomicon')
    expect(w.cell({ col: AT.col + 1, row: AT.row }).kind).toBe('necronomicon')
  })
})

describe('necronomicon.save', () => {
  test('A dump and parse round-trips the book — its locked crop, counts, the fruit already given and the closed pages — and the farm keeps `grandma` with every unread letter.', () => {
    const { w, book } = farm()
    book.crop = 'apple'
    book.cropCount = 7
    book.fruit.push('carrot', 'potato')
    book.ash = 41
    book.gold = NECRO_GOLD
    book.done.push('crop')
    advanceGrandma(w, GRANDMA_DAY.gone)

    const out = parse(JSON.stringify(dump(w)))
    expect(out.ok).toBe(true)
    if (!out.ok) throw new Error('parse')
    const back = out.world.cell(AT)
    if (back.kind !== 'necronomicon') throw new Error('necronomicon')
    expect(back.crop).toBe('apple')
    expect(back.cropCount).toBe(7)
    expect(back.fruit).toEqual(['carrot', 'potato'])
    expect(back.ash).toBe(41)
    expect(back.gold).toBe(NECRO_GOLD)
    expect(back.done).toEqual(['crop'])
    expect(out.world.necronomicon).toBe(back)
    expect(out.world.grandma).toBe('gone')
    expect(out.world.grandmaUnseen).toEqual(['ill', 'care', 'gone'])
    expect(GRANDMA_IDS.indexOf(out.world.grandma)).toBeGreaterThan(0)
  })
})
