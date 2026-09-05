import { expect, test } from 'vitest'
import { atlasVb, treeAtlasStage } from './atlas.ts'
import { fruitGroup, graftSpecies, ripeGroup, varietyGroup } from './svgs.ts'
import { caskGroup, VARIETIES } from '../defs/varieties.ts'
import { ANNUAL_IDS, CASK_IDS, TREE_IDS, type CropId } from '../sim/ids.ts'

const ASSETS = import.meta.glob('../../assets/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

test('view.edge — dirt-edge / dirt-inset pad to 32; dirt-0 stays 24', () => {
  expect(atlasVb('dirt-edge')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-inset')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-0')).toEqual({ w: 24, h: 24 })
})

test("view.variety — Plant ripe, fruit, cask, tree ripe, and graft faces select the Variety's `tier` as its `<g id>` group. Never a ladder, never positional: one crop carries at most one `'variant'` and one `'heirloom'`. Unripe trees carry no Variety. Casks collapse `'variant'` onto `'base'`. HUD chrome uses the same selector in `svgs.ts`.", () => {
  expect(varietyGroup('base')).toBe('base')
  expect(varietyGroup('bintje')).toBe('variant')
  expect(varietyGroup('san-marzano')).toBe('heirloom')
  expect(varietyGroup('blenheim')).toBe('variant')
  expect(varietyGroup('klosterneuburger')).toBe('heirloom')
  expect(ripeGroup('base')).toBe('ripe')
  expect(ripeGroup('concord')).toBe('ripe-variant')
  expect(ripeGroup('keknyelu')).toBe('ripe-heirloom')
  expect(fruitGroup('base')).toBe('base')
  expect(fruitGroup('arbequina')).toBe('variant')
  expect(treeAtlasStage('unripe', 'pink-lady')).toBe('unripe')
  expect(treeAtlasStage('ripe', 'pink-lady')).toBe('ripe-heirloom')
  expect(treeAtlasStage('ripe', 'kingston-black')).toBe('ripe-variant')
  expect(caskGroup('base')).toBe('base')
  expect(caskGroup('concord')).toBe('base')
  expect(caskGroup('kingston-black')).toBe('base')
  expect(caskGroup('keknyelu')).toBe('heirloom')
})

function groupIds(file: string): string[] {
  return [...ASSETS[`../../assets/${file}`].matchAll(/<g id="([^"]+)"/g)].map(mm => mm[1])
}

test('view.groups — every `<g id>` the atlas asks for exists in the file it reads, and the file carries no group the atlas never asks for. Missing group is a permanent atlas boot failure; a spare one is art nobody can reach.', () => {
  for (const crop of [...ANNUAL_IDS, ...TREE_IDS] as CropId[]) {
    expect(groupIds(`fruits/fruit-${crop}.svg`)).toEqual(VARIETIES[crop].map(fruitGroup))
  }
  for (const crop of ANNUAL_IDS) {
    expect(groupIds(`crops/crop-${crop}.svg`)).toEqual(['sprout', 'grow', ...VARIETIES[crop].map(ripeGroup), 'dead'])
  }
  for (const tree of TREE_IDS) {
    expect(groupIds(`props/prop-${tree}-tree.svg`)).toEqual([
      'trunk',
      'grow',
      'unripe',
      ...VARIETIES[tree].map(v => treeAtlasStage('ripe', v)),
    ])
    const served = ([...ANNUAL_IDS, ...TREE_IDS] as CropId[]).filter(c => graftSpecies(c) === tree)
    const want = (['base', 'variant', 'heirloom'] as const).filter(g =>
      served.some(c => VARIETIES[c].map(fruitGroup).includes(g)),
    )
    expect(groupIds(`items/item-graft-${tree}.svg`)).toEqual(want)
  }
  for (const cask of CASK_IDS) expect(groupIds(`items/item-${cask}.svg`)).toEqual(['base', 'heirloom'])
})
