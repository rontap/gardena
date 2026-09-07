import { describe, expect, test, vi } from 'vitest'

vi.hoisted(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  }))
})

import { m } from '../../paraglide/messages.js'
import { BootOverlay } from './map.tsx'

describe('view.boot', () => {
  test('Until `WorldView.mount` + first `layout` (`onReady`), a `pointer-events-none` overlay on the map host: centered **Loading...**, display face, `text-5xl`, fade in 0.5s ease-in to 0.7 then fade out. Play and menu. Menu canvas fade-in still runs after `onReady`. Not Pixi. Not a `DirtyReason`.', () => {
    const shown = BootOverlay({ show: true })
    expect(shown).toBeDefined()
    if (shown === undefined) return
    expect(shown.props.className).toContain('pointer-events-none')
    expect(shown.props.children.props.className).toContain('font-display')
    expect(shown.props.children.props.className).toContain('text-5xl')
    expect(shown.props.children.props.className).toContain('farm-fade-in')
    expect(shown.props.children.props.children).toBe(m.hud_loading())
    expect(BootOverlay({ show: false })).toBeUndefined()
  })
})
