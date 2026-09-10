import { m } from '../../paraglide/messages.js'
import type { Grandma, GrownCrop, PageId, ResearchId, SupperId } from '../sim/ids.ts'

export const NECRO_W = 2
export const NECRO_H = 2

export const NECRO_COST = 13
export const NECRO_SECONDS = 66
export const NECRO_PRICE = 66

export const NECRO_CROP = 20
export const NECRO_ASH = 66
export const NECRO_GOLD = 666
export const NECRO_AGARIC = 3

export const NECRO_RESEARCH: ResearchId = 'unlock-necronomicon'

export const EARLY_FRUIT: readonly GrownCrop[] = ['carrot', 'potato', 'wheat', 'tomato', 'raspberry', 'grape']

export const SUPPER: readonly SupperId[] = ['palinka', 'wine', 'bread']

export const SUPPER_VARIETY = { palinka: 'klosterneuburger', wine: 'keknyelu' } as const

export type PageNeed =
  | { kind: 'crop'; count: number }
  | { kind: 'each'; crops: readonly GrownCrop[] }
  | { kind: 'ash'; count: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'agaric'; count: number }
  | { kind: 'tool' }
  | { kind: 'supper'; goods: readonly SupperId[] }

export type PageLock = { pages: number; research: readonly ResearchId[] }

export type PageDef = {
  id: PageId
  name: string
  blurb: string
  need: PageNeed
  lock: PageLock
}

export const PAGE_IDS: readonly PageId[] = ['crop', 'early-fruit', 'agaric', 'ash', 'gold', 'tool', 'supper']

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
  agaric: {
    id: 'agaric',
    name: m.necro_page_agaric_name(),
    blurb: m.necro_page_agaric_blurb(),
    need: { kind: 'agaric', count: NECRO_AGARIC },
    lock: { pages: 2, research: [] },
  },
  tool: {
    id: 'tool',
    name: m.necro_page_tool_name(),
    blurb: m.necro_page_tool_blurb(),
    need: { kind: 'tool' },
    lock: { pages: 3, research: [] },
  },
  supper: {
    id: 'supper',
    name: m.necro_page_supper_name(),
    blurb: m.necro_page_supper_blurb(),
    need: { kind: 'supper', goods: SUPPER },
    lock: { pages: 4, research: [] },
  },
}

export const GRANDMA_DAY: { readonly [K in Grandma]: number } = { well: 0, ill: 4, care: 6, gone: 8, told: 10 }

export function pageWant(id: PageId): number {
  const need = PAGES[id].need
  if (need.kind === 'crop') return need.count
  if (need.kind === 'each') return need.crops.length
  if (need.kind === 'ash') return need.count
  if (need.kind === 'agaric') return need.count
  if (need.kind === 'tool') return 1
  if (need.kind === 'supper') return need.goods.length
  return need.amount
}
