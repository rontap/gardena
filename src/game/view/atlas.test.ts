import { expect, test } from 'vitest'
import { atlasVb } from './atlas.ts'

test('view.edge — dirt-edge / dirt-inset pad to 32; dirt-0 stays 24', () => {
  expect(atlasVb('dirt-edge')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-inset')).toEqual({ w: 32, h: 32 })
  expect(atlasVb('dirt-0')).toEqual({ w: 24, h: 24 })
})
