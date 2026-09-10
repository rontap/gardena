import type { GrownCrop, PageId, SupperId } from '../ids.ts'

export type PageClaim =
  | { page: 'crop'; n: number; crop: GrownCrop }
  | { page: 'early-fruit'; n: number; crop: GrownCrop }
  | { page: 'ash'; n: number }
  | { page: 'agaric'; n: number }
  | { page: 'tool'; n: number }
  | { page: 'supper'; n: number; good: SupperId }

export type PageState = { id: PageId; have: number; want: number; done: boolean; crop: GrownCrop | 'none' }
