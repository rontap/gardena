import { expect, test } from 'vitest'
import { atlasVb, treeAtlasStage } from './atlas.ts'
import { fruitGroup, graftSpecies, jamArt, ripeGroup, spiritArt, varietyGroup } from './svgs.ts'
import { caskGroup, VARIETIES, VARIETY_IDS } from '../defs/varieties.ts'
import { ANNUAL_IDS, CASK_IDS, JAM_CROPS, SPIRIT_KINDS, TREE_IDS, type CropId } from '../sim/ids.ts'

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

test('view.named-face — `jamArt` and `spiritArt` are the only statement of which face a named product draws. A Variety that renames a jar or a bottle draws its own file; every other Variety of that crop falls back to the crop face. Every face they can name has a file.', () => {
  expect(jamArt('grape', 'concord')).toBe('jam-concord')
  expect(jamArt('raspberry', 'black-raspberry')).toBe('jam-black-raspberry')
  expect(jamArt('tomato', 'san-marzano')).toBe('passata')
  expect(jamArt('tomato', 'base')).toBe('ketchup')
  expect(jamArt('tomato', 'green-zebra')).toBe('ketchup')
  expect(jamArt('apricot', 'blenheim')).toBe('jam-apricot')
  expect(spiritArt('brandy', 'klosterneuburger')).toBe('spirit-palinka')
  expect(spiritArt('brandy', 'blenheim')).toBe('spirit-brandy')
  SPIRIT_KINDS.forEach(k => expect(spiritArt(k, 'base')).toBe(`spirit-${k}`))
  const files = [
    ...JAM_CROPS.flatMap(crop => VARIETIES[crop].map(v => jamArt(crop, v))),
    ...SPIRIT_KINDS.flatMap(k => VARIETY_IDS.map(v => spiritArt(k, v))),
  ]
  files.forEach(id => expect(ASSETS[`../../assets/items/item-${id}.svg`]).toBeDefined())
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
