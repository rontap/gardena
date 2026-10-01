import { describe, expect, test } from 'vitest'
import { catalogEntries } from '../../defs/catalog.ts'
import { WATER_OVERVIEW } from './almanac.tsx'
import { linksResolve } from './nav.tsx'

describe('almanac.links', () => {
  test('Every `[label](tab:id)` link in an Almanac description or the Water overview opens an existing row; an unknown tab or row does not resolve.', () => {
    catalogEntries(1).forEach(e => expect(linksResolve(e.blurb), e.id).toBe(true))
    WATER_OVERVIEW.forEach(p => expect(linksResolve(p()), p()).toBe(true))
    expect(linksResolve('[Pump](water:nope)')).toBe(false)
    expect(linksResolve('[Pump](nope:pumpjack)')).toBe(false)
  })
})
