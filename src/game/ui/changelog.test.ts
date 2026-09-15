// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { ChangelogParseError, NOTE_SIGN, parseChangelog, RELEASES, topLineShape } from './changelog.ts'

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

  test('missing kind emoji is improvement, trimmed, notes legal under any kind', () => {
    const src = `# 1.0 Title

Summary.

- No emoji
  - A note
- 🔧 Has emoji
  - Another
`
    expect(parseChangelog(src)).toEqual([
      {
        id: '1.0',
        name: 'Title',
        summary: 'Summary.',
        changes: [
          { kind: 'improvement', text: 'No emoji', notes: ['A note'] },
          { kind: 'improvement', text: 'Has emoji', notes: ['Another'] },
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

  test('A line ending `- Aron` is prose whatever it holds: it stands as the summary, keeps its text trimmed, and never throws.', () => {
    const [release] = parseChangelog(`# 1.0 Title\n\n Reworked the Build menu, and **every** building can now be deleted. - Aron \n\n- \u2728 Text\n`)
    expect(NOTE_SIGN).toBe('- Aron')
    expect(release.summary).toBe('Reworked the Build menu, and **every** building can now be deleted. - Aron')
    expect(release.changes).toHaveLength(1)
  })

  test('A line ending `- Aron` beside a summary joins it, and one among the changes is passed over.', () => {
    const [release] = parseChangelog(`# 1.0 Title\n\nSummary.\nSecond thoughts - Aron\n\n- \u2728 Text\n loose note - Aron\n- \u{1F41B} Fix\n`)
    expect(release.summary).toBe('Summary. Second thoughts - Aron')
    expect(release.changes.map(c => c.kind)).toEqual(['feature', 'bugfix'])
  })

  test('A line without that ending still throws.', () => {
    throws(`# 1.0 Title\n\nSummary.\n\n- \u2728 Text\n loose note - Bela\n`)
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

test('shipped RELEASES parse', () => {
  expect(RELEASES.length).toBeGreaterThan(0)
  for (const release of RELEASES) {
    expect(release.id).not.toBe('')
    expect(release.name).not.toBe('')
    expect(release.summary).not.toBe('')
  }
})
