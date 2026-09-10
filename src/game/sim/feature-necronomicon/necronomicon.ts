import {
  EARLY_FRUIT,
  GRANDMA_DAY,
  NECRO_ASH,
  NECRO_CROP,
  NECRO_GOLD,
  PAGES,
  PAGE_IDS,
  pageWant,
} from '../../defs/necronomicon.ts'
import type { Coord, Necronomicon } from '../building.ts'
import { takeCount } from '../feature-machines/machine.ts'
import { GRANDMA_IDS, type Grandma, type PageId } from '../ids.ts'
import type { Item } from '../item.ts'
import type { World } from '../world.ts'
import type { PageClaim, PageState } from './necronomicon.h.ts'

export function pageFilled(book: Necronomicon, id: PageId): number {
  if (id === 'crop') return book.cropCount
  if (id === 'early-fruit') return book.fruit.length
  if (id === 'ash') return book.ash
  return book.gold
}

export function pageDone(book: Necronomicon, id: PageId): boolean {
  return book.done.includes(id)
}

export function pageFull(book: Necronomicon, id: PageId): boolean {
  return pageFilled(book, id) >= pageWant(id)
}

export function pageOpen(w: World, book: Necronomicon, id: PageId): boolean {
  const lock = PAGES[id].lock
  return book.done.length >= lock.pages && lock.research.every(r => w.done.has(r))
}

export function pageStates(w: World, book: Necronomicon): PageState[] {
  return PAGE_IDS.filter(id => pageOpen(w, book, id)).map(id => ({
    id,
    have: pageFilled(book, id),
    want: pageWant(id),
    done: pageDone(book, id),
    crop: id === 'crop' ? book.crop : 'none',
  }))
}

export function pagesHidden(w: World, book: Necronomicon): boolean {
  return PAGE_IDS.some(id => !pageOpen(w, book, id))
}

export function ritualReady(w: World, book: Necronomicon): boolean {
  return PAGE_IDS.some(id => pageOpen(w, book, id) && !pageDone(book, id) && pageFull(book, id))
}

export function pageClaim(book: Necronomicon, item: Item): PageClaim | undefined {
  if (item.kind === 'ash') {
    const room = NECRO_ASH - book.ash
    if (book.done.includes('ash') || room <= 0 || item.count <= 0) return undefined
    return { page: 'ash', n: Math.min(room, item.count), crop: 'none' }
  }
  if (item.kind !== 'fruit' || item.cut || item.count <= 0) return undefined
  if (
    !book.done.includes('early-fruit') &&
    EARLY_FRUIT.includes(item.crop) &&
    !book.fruit.includes(item.crop)
  ) {
    return { page: 'early-fruit', n: 1, crop: item.crop }
  }
  const room = NECRO_CROP - book.cropCount
  if (book.done.includes('crop') || room <= 0) return undefined
  if (book.crop !== 'none' && book.crop !== item.crop) return undefined
  return { page: 'crop', n: Math.min(room, item.count), crop: item.crop }
}

export function applyClaim(book: Necronomicon, claim: PageClaim, n: number): void {
  if (claim.page === 'ash') {
    book.ash += n
    return
  }
  if (claim.page === 'early-fruit') {
    if (claim.crop === 'none') return
    book.fruit.push(claim.crop)
    return
  }
  if (claim.crop === 'none') return
  book.crop = claim.crop
  book.cropCount += n
}

export function openClaim(w: World, book: Necronomicon, item: Item): PageClaim | undefined {
  const claim = pageClaim(book, item)
  if (claim === undefined) return undefined
  return pageOpen(w, book, claim.page) ? claim : undefined
}

export function bookOf(w: World): Necronomicon | undefined {
  return w.necronomicon === 'none' ? undefined : w.necronomicon
}

export function canSacrifice(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'necronomicon') return false
  return openClaim(w, c, w.act.hand.item) !== undefined
}

export function doSacrifice(w: World, at: Coord): void {
  if (w.act.hand.kind !== 'hold') return
  const book = w.cell(at)
  if (book.kind !== 'necronomicon') return
  const claim = openClaim(w, book, w.act.hand.item)
  if (claim === undefined) return
  applyClaim(book, claim, claim.n)
  if (takeCount(w.act.hand.item, claim.n)) w.act.hand = { kind: 'empty' }
  w.track(at, book)
}

export function sacrificeGoldBody(w: World): void {
  const book = bookOf(w)
  if (book === undefined) return
  if (!pageOpen(w, book, 'gold') || book.done.includes('gold')) return
  if (book.gold >= NECRO_GOLD || w.money < NECRO_GOLD) return
  w.money -= NECRO_GOLD
  book.gold = NECRO_GOLD
  w.ping()
}

export function ritualBody(w: World): void {
  const book = bookOf(w)
  if (book === undefined) return
  if (w.clock.phase() !== 'twilight') return
  const ready = PAGE_IDS.filter(id => pageOpen(w, book, id) && !pageDone(book, id) && pageFull(book, id))
  if (ready.length === 0) return
  ready.forEach(id => book.done.push(id))
  w.ping()
}

export function grandmaAt(day: number): Grandma {
  return GRANDMA_IDS.reduce((best, beat) => (day >= GRANDMA_DAY[beat] ? beat : best), 'well' as Grandma)
}

export function advanceGrandma(w: World, endedDay: number): void {
  const next = grandmaAt(endedDay)
  if (GRANDMA_IDS.indexOf(next) <= GRANDMA_IDS.indexOf(w.grandma)) return
  const beats = GRANDMA_IDS.slice(GRANDMA_IDS.indexOf(w.grandma) + 1, GRANDMA_IDS.indexOf(next) + 1)
  w.grandma = next
  beats.forEach(b => w.grandmaUnseen.push(b))
}
