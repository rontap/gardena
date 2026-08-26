import { describe, expect, test } from 'vitest'
import { ChangelogParseError, parseChangelog, RELEASES, topLineShape } from './changelog.ts'

function throws(src: string) {
  expect(() => parseChangelog(src)).toThrow(ChangelogParseError)
}

describe('changelog dialect', () => {
  test('well-formed major-feature nests a feature, notes, and nested major-feature with empty changes', () => {
    const src = `# 1.0 Alpha

Wrapped
summary.

- 🎉 Major
  - Parent note
  - ✨ Nested feature
    - Nested note
  - 🎉 Nested major
- 🔧 Polish
- 🐛 Fix
  - Fix note
- 🚫 Drop
`
    expect(parseChangelog(src)).toEqual([
      {
        id: '1.0',
        name: 'Alpha',
        summary: 'Wrapped summary.',
        changes: [
          {
            kind: 'major-feature',
            text: 'Major',
            notes: ['Parent note'],
            changes: [
              { kind: 'feature', text: 'Nested feature', notes: ['Nested note'] },
              { kind: 'major-feature', text: 'Nested major', notes: [], changes: [] },
            ],
          },
          { kind: 'improvement', text: 'Polish', notes: [] },
          { kind: 'bugfix', text: 'Fix', notes: ['Fix note'] },
          { kind: 'deprecation', text: 'Drop', notes: [] },
        ],
      },
    ])
  })

  test('empty notes and empty nested changes parse as []', () => {
    const src = `# 2.0 Beta

One line.

- 🎉 Solo
- ✨ Bare
`
    expect(parseChangelog(src)).toEqual([
      {
        id: '2.0',
        name: 'Beta',
        summary: 'One line.',
        changes: [
          { kind: 'major-feature', text: 'Solo', notes: [], changes: [] },
          { kind: 'feature', text: 'Bare', notes: [] },
        ],
      },
    ])
  })

  test('empty file throws ChangelogParseError', () => {
    throws('')
    throws('\n\n')
    throws('   \n')
  })

  test('missing id throws ChangelogParseError', () => {
    throws(`#  Title

Summary.

- ✨ Text
`)
  })

  test('missing name throws ChangelogParseError', () => {
    throws(`# 1.0

Summary.

- ✨ Text
`)
  })

  test('missing summary throws ChangelogParseError', () => {
    throws(`# 1.0 Title

- ✨ Text
`)
    throws(`# 1.0 Title
`)
  })

  test('empty text throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

- ✨ 
`)
    throws(`# 1.0 Title

Summary.

- ✨
`)
  })

  test('empty note throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

- ✨ Text
  - 
`)
  })

  test('unknown emoji throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

- 🔥 Text
`)
  })

  test('nested Change under non-major-feature throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

- ✨ Text
  - 🔧 Nested
`)
  })

  test('duplicate id throws ChangelogParseError', () => {
    throws(`# 1.0 First

Summary.

- ✨ Text

# 1.0 Second

Summary.

- ✨ Text
`)
  })

  test('extra construct ## throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

## nope
`)
  })

  test('wrong indent throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

 - ✨ Text
`)
    throws(`# 1.0 Title

Summary.

- ✨ Text
   - note
`)
  })

  test('4-space kind emoji throws ChangelogParseError', () => {
    throws(`# 1.0 Title

Summary.

- 🎉 Major
  - ✨ Nested
    - 🔧 Deeper
`)
  })
})

const TOP_LINE = /^(New|Added|Removed|Changed|Fixed bug) (building|item|ui|mechanic|multiplayer)\b/

test('A top-level changelog line is {emoji} {New|Added|Removed|Changed|Fixed bug} {building|item|ui|mechanic|multiplayer} {*}.', () => {
  expect(topLineShape('Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.')).toBe(true)
  expect(topLineShape('New item: Seed. Plants a crop.')).toBe(true)
  expect(topLineShape('Removed ui: Old panel. Players cannot open it.')).toBe(true)
  expect(topLineShape('Changed mechanic: previously, it did this, now it does that.')).toBe(true)
  expect(topLineShape('Fixed bug multiplayer: Hosts saw ghosts, now they do not.')).toBe(true)
  expect(topLineShape('Large freezer.')).toBe(false)
  expect(topLineShape('Added a pulser, a counter, and a day sensor')).toBe(false)
  expect(topLineShape('Freezer, mill, and chest added')).toBe(false)
  expect(topLineShape('Added the freezer.')).toBe(false)
  expect(topLineShape('added building: Freezer.')).toBe(false)
  expect(topLineShape('Added Building')).toBe(false)
  expect(topLineShape('fixed bug ui:')).toBe(false)
})

test('shipped RELEASES top-level Change.text', () => {
  for (const release of RELEASES) {
    for (const change of release.changes) {
      expect(topLineShape(change.text)).toBe(true)
      const type = TOP_LINE.exec(change.text)![2]
      if (type === 'mechanic') {
        if (change.kind === 'major-feature') {
          expect(change.changes).toEqual([])
        }
      } else {
        expect(change.notes.length).toBe(0)
        if (change.kind === 'major-feature') {
          expect(change.changes).toEqual([])
        }
      }
    }
  }
})
