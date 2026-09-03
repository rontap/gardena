import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { ResearchId } from '../sim/ids.ts'
import { RESEARCH } from './research.ts'

describe('research i18n', () => {
  test('RESEARCH[id].name and .blurb and SKILLS[id].name/.blurb become calls to `m.*`', () => {
    const ids = Object.keys(RESEARCH) as ResearchId[]
    for (const id of ids) {
      const stem = id.replaceAll('-', '_')
      const bag = m as unknown as Record<string, () => string>
      expect(RESEARCH[id].name, id).toBe(bag[`research_${stem}_name`]())
      expect(RESEARCH[id].blurb, id).toBe(bag[`research_${stem}_blurb`]())
    }
  })
})
