import { expect, test } from 'vitest'
import { atlasVb } from './atlas.ts'
import { caskGroup, fruitGroup, ripeGroup, varietyGroup } from './svgs.ts'

test('view.edge — dirt-edge / dirt-inset pad to 32; dirt-0 stays 24', () => {
  expect(atlasVb('dirt-edge')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-inset')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-0')).toEqual({ w: 24, h: 24 })
})

test("view.variety — Plant ripe, fruit, cask, tree unripe/ripe, and graft faces select `varietyGroup(crop, variety)`. Never a ladder. Two Varieties of one crop that share a `tier` `'variant'` take `'variant'` then `'variant-2'` in `VARIETIES[crop]` order. The first `'variant'` of a crop is `'variant'` / `ripe-variant`, including when it is the only one. HUD chrome uses the same selector in `svgs.ts`.", () => {
  expect(varietyGroup('carrot', 'base')).toBe('base')
  expect(varietyGroup('potato', 'bintje')).toBe('variant')
  expect(varietyGroup('potato', 'russian-banana')).toBe('heirloom')
  expect(varietyGroup('wheat', 'sonora')).toBe('variant')
  expect(varietyGroup('tomato', 'green-zebra')).toBe('variant')
  expect(varietyGroup('grape', 'concord')).toBe('variant')
  expect(varietyGroup('grape', 'thompson')).toBe('variant-2')
  expect(varietyGroup('grape', 'keknyelu')).toBe('heirloom')
  expect(varietyGroup('olive', 'kalamata')).toBe('variant')
  expect(varietyGroup('olive', 'arbequina')).toBe('variant-2')
  expect(ripeGroup('grape', 'concord')).toBe('ripe-variant')
  expect(ripeGroup('grape', 'thompson')).toBe('ripe-variant-2')
  expect(ripeGroup('potato', 'bintje')).toBe('ripe-variant')
  expect(ripeGroup('potato', 'russian-banana')).toBe('ripe-heirloom')
  expect(fruitGroup('grape', 'base')).toBe('base')
  expect(fruitGroup('grape', 'concord')).toBe('variant')
  expect(caskGroup('base')).toBe('common')
  expect(caskGroup('concord')).toBe('rare')
  expect(caskGroup('thompson')).toBe('rare')
  expect(caskGroup('keknyelu')).toBe('heirloom')
})
