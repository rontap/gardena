import { m } from '../../paraglide/messages.js'
import type { TreeId } from '../sim/ids.ts'

export const TREE_YIELD_DAYS = 2
export const TREE_YIELD_MUL = 3
export const TREE_OFF_MUL = 0.7

export type TreeDef = {
  id: TreeId
  juvenileSeconds: number
  fruitSeconds: number
}

export const TREES: { readonly [K in TreeId]: TreeDef } = {
  apricot: { id: 'apricot', juvenileSeconds: 192, fruitSeconds: 200 },
  apple: { id: 'apple', juvenileSeconds: 240, fruitSeconds: 300 },
  cherry: { id: 'cherry', juvenileSeconds: 336, fruitSeconds: 160 },
  olive: { id: 'olive', juvenileSeconds: 384, fruitSeconds: 260 },
}

export const TREE_NAME: { readonly [K in TreeId]: () => string } = {
  apple: () => m.names_crop_apple(),
  apricot: () => m.names_crop_apricot(),
  olive: () => m.names_crop_olive(),
  cherry: () => m.names_crop_cherry(),
}
