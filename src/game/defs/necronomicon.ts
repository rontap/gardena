import { m } from '../../paraglide/messages.js'
import type { Grandma, GrownCrop, PageId, ResearchId } from '../sim/ids.ts'

export const NECRO_W = 2
export const NECRO_H = 2

export const NECRO_COST = 13
export const NECRO_SECONDS = 66
export const NECRO_PRICE = 66

export const NECRO_CROP = 20
export const NECRO_ASH = 66
export const NECRO_GOLD = 666

export const NECRO_RESEARCH: ResearchId = 'unlock-necronomicon'

export const EARLY_FRUIT: readonly GrownCrop[] = ['carrot', 'potato', 'wheat', 'tomato', 'raspberry', 'grape']

export type PageNeed =
  | { kind: 'crop'; count: number }
  | { kind: 'each'; crops: readonly GrownCrop[] }
  | { kind: 'ash'; count: number }
  | { kind: 'gold'; amount: number }

export type PageLock = { pages: number; research: readonly ResearchId[] }

export type PageDef = {
  id: PageId
  name: string
  blurb: string
  need: PageNeed
  lock: PageLock
}

export const PAGE_IDS: readonly PageId[] = ['crop', 'early-fruit', 'ash', 'gold']

export const PAGES: { readonly [K in PageId]: PageDef } = {
  crop: {
    id: 'crop',
    name: m.necro_page_crop_name(),
    blurb: m.necro_page_crop_blurb(),
    need: { kind: 'crop', count: NECRO_CROP },
    lock: { pages: 0, research: [] },
  },
  'early-fruit': {
    id: 'early-fruit',
    name: m.necro_page_early_fruit_name(),
    blurb: m.necro_page_early_fruit_blurb(),
    need: { kind: 'each', crops: EARLY_FRUIT },
    lock: { pages: 0, research: [] },
  },
  ash: {
    id: 'ash',
    name: m.necro_page_ash_name(),
    blurb: m.necro_page_ash_blurb(),
    need: { kind: 'ash', count: NECRO_ASH },
    lock: { pages: 2, research: ['unlock-furnace'] },
  },
  gold: {
    id: 'gold',
    name: m.necro_page_gold_name(),
    blurb: m.necro_page_gold_blurb(),
    need: { kind: 'gold', amount: NECRO_GOLD },
    lock: { pages: 2, research: [] },
  },
}

export const GRANDMA_DAY: { readonly [K in Grandma]: number } = { well: 0, ill: 4, care: 6, gone: 8, told: 10 }

export function pageWant(id: PageId): number {
  const need = PAGES[id].need
  if (need.kind === 'crop') return need.count
  if (need.kind === 'each') return need.crops.length
  if (need.kind === 'ash') return need.count
  return need.amount
}
