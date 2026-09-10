import type { GrownCrop, PageId } from '../ids.ts'

export type PageClaim = { page: PageId; n: number; crop: GrownCrop | 'none' }

export type PageState = { id: PageId; have: number; want: number; done: boolean; crop: GrownCrop | 'none' }
