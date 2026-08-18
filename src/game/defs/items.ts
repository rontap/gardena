import type { ContainerId, ShovelId } from '../sim/ids.ts'

export const SHOVELS: { readonly [K in ShovelId]: { uses: number; workSeconds: number } } = {
  shovel: { uses: 100, workSeconds: 1 },
  'better-shovel': { uses: 250, workSeconds: 0.5 },
}

export const CONTAINERS: { readonly [K in ContainerId]: { capacityLiters: number } } = {
  bucket: { capacityLiters: 3 },
  'large-bucket': { capacityLiters: 8 },
}

export const BOX_SMALL = 5
export const BOX_LARGE = 15
