import { describe, expect, test } from 'vitest'
import { catalogEntries } from '../../defs/catalog.ts'
import { linksResolve, WATER_OVERVIEW } from './almanac.tsx'
import { trailBack, trailForward, trailPush, trailStart, type AlmanacNav } from './nav.tsx'

describe('almanac.links', () => {
  test('Every `[label](tab:id)` link in an Almanac description or the Water overview opens an existing row; an unknown tab or row does not resolve.', () => {
    catalogEntries(1).forEach(e => expect(linksResolve(e.blurb), e.id).toBe(true))
    WATER_OVERVIEW.forEach(p => expect(linksResolve(p()), p()).toBe(true))
    expect(linksResolve('[Pump](water:nope)')).toBe(false)
    expect(linksResolve('[Pump](nope:pumpjack)')).toBe(false)
  })
})

const loc = (tab: AlmanacNav['tab'], id: string): AlmanacNav => ({ tab, id })

describe('almanac.trail', () => {
  test('Back returns to the previous page. A new link drops the pages ahead. Back and forward walk the same list.', () => {
    const a = loc('fruits', 'overview')
    const b = loc('concepts', 'market')
    const c = loc('water', 'pumpjack')
    const d = loc('water', 'valve')
    let trail = trailPush(trailStart(a), b)
    expect(trail.stack).toEqual([a, b])
    trail = trailBack(trail)
    expect(trail.stack[trail.at]).toEqual(a)
    trail = trailPush(trail, c)
    expect(trail.stack).toEqual([a, c])
    trail = trailPush(trailPush(trail, b), d)
    expect(trail.stack).toEqual([a, c, b, d])
    trail = trailBack(trailBack(trailBack(trail)))
    expect(trail.stack[trail.at]).toEqual(a)
    trail = trailForward(trailForward(trailForward(trail)))
    expect(trail.stack[trail.at]).toEqual(d)
  })
})
