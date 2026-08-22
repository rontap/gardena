import type { TreeId } from '../sim/ids.ts'

export const TREE_YIELD_DAYS = 2
export const TREE_YIELD_MUL = 3
export const TREE_OFF_MUL = 0.75

export type TreeDef = {
  id: TreeId
  juvenileSeconds: number
  fruitSeconds: number
}

export const TREES: { readonly [K in TreeId]: TreeDef } = {
  apple: { id: 'apple', juvenileSeconds: 480, fruitSeconds: 720 },
  apricot: { id: 'apricot', juvenileSeconds: 480, fruitSeconds: 180 },
  lemon: { id: 'lemon', juvenileSeconds: 480, fruitSeconds: 200 },
  cherry: { id: 'cherry', juvenileSeconds: 480, fruitSeconds: 143 },
}

export const TREE_NAME: { readonly [K in TreeId]: string } = {
  apple: 'Apple',
  apricot: 'Apricot',
  lemon: 'Lemon',
  cherry: 'Cherry',
}
