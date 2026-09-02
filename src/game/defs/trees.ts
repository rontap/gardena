import type { TreeId } from '../sim/ids.ts'

export const TREE_YIELD_DAYS = 2
export const TREE_YIELD_MUL = 3.5
export const TREE_OFF_MUL = 0.75

export type TreeDef = {
  id: TreeId
  juvenileSeconds: number
  fruitSeconds: number
}

export const TREES: { readonly [K in TreeId]: TreeDef } = {
  apricot: { id: 'apricot', juvenileSeconds: 192, fruitSeconds: 180 },
  apple: { id: 'apple', juvenileSeconds: 240, fruitSeconds: 302.4 },
  cherry: { id: 'cherry', juvenileSeconds: 336, fruitSeconds: 124.8 },
  olive: { id: 'olive', juvenileSeconds: 384, fruitSeconds: 240 },
}

export const TREE_NAME: { readonly [K in TreeId]: string } = {
  apple: 'Apple',
  apricot: 'Apricot',
  olive: 'Olive',
  cherry: 'Cherry',
}
