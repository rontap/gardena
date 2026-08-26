import src from './changelog.md?raw'

export type ChangeKind = 'bugfix' | 'improvement' | 'feature' | 'deprecation' | 'major-feature'

export type Change =
  | { kind: Exclude<ChangeKind, 'major-feature'>; text: string; notes: readonly string[] }
  | { kind: 'major-feature'; text: string; notes: readonly string[]; changes: readonly Change[] }

export type Release = {
  id: string
  name: string
  summary: string
  changes: readonly Change[]
}

export const KIND_EMOJI: { readonly [K in ChangeKind]: string } = {
  'major-feature': '🎉',
  feature: '✨',
  improvement: '🔧',
  bugfix: '🐛',
  deprecation: '🚫',
}

const EMOJI_KIND: { readonly [emoji: string]: ChangeKind } = Object.fromEntries(
  (Object.keys(KIND_EMOJI) as ChangeKind[]).map(kind => [KIND_EMOJI[kind], kind]),
)

export class ChangelogParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChangelogParseError'
  }
}

type MutableChange =
  | { kind: Exclude<ChangeKind, 'major-feature'>; text: string; notes: string[] }
  | { kind: 'major-feature'; text: string; notes: string[]; changes: MutableChange[] }

type MutableRelease = {
  id: string
  name: string
  summary: string
  changes: MutableChange[]
}

function fail(message: string): never {
  throw new ChangelogParseError(message)
}

function isBlank(line: string): boolean {
  return line === '' || /^ +$/.test(line)
}

function isExtra(line: string): boolean {
  if (line.startsWith('##')) return true
  if (line.startsWith('---')) return true
  if (line.startsWith('* ') || line.startsWith('+ ')) return true
  if (/^\d+\. /.test(line)) return true
  if (/<[A-Za-z/!?]/.test(line)) return true
  if (/\[[^\]]+\]\([^)]*\)/.test(line)) return true
  if (line.includes('**') || line.includes('__')) return true
  if (line.includes('*')) return true
  return false
}

function kindPrefix(body: string): ChangeKind | undefined {
  for (const emoji of Object.keys(EMOJI_KIND)) {
    if (body === emoji || body.startsWith(emoji)) return EMOJI_KIND[emoji]
  }
  return undefined
}

function takeKind(body: string): { kind: ChangeKind; text: string } {
  const kind = kindPrefix(body)
  if (kind === undefined) fail('unknown emoji')
  const emoji = KIND_EMOJI[kind]
  if (body === emoji) fail('empty text')
  if (!body.startsWith(`${emoji} `)) fail('empty text')
  const text = body.slice(emoji.length + 1)
  if (text === '') fail('empty text')
  return { kind, text }
}

function makeChange(kind: ChangeKind, text: string): MutableChange {
  if (kind === 'major-feature') {
    return { kind, text, notes: [], changes: [] }
  }
  return { kind, text, notes: [] }
}

function listItem(line: string): { indent: number; body: string } | undefined {
  let indent = 0
  while (indent < line.length && line[indent] === ' ') indent++
  const after = line.slice(indent)
  if (!after.startsWith('- ')) return undefined
  if (indent !== 0 && indent !== 2 && indent !== 4) fail('wrong indent')
  return { indent, body: after.slice(2) }
}

export function parseChangelog(src: string): readonly Release[] {
  const lines = src.split('\n').map(line => (line.endsWith('\r') ? line.slice(0, -1) : line))
  let i = 0
  const n = lines.length

  const skipBlanks = () => {
    while (i < n) {
      const line = lines[i]
      if (line.includes('\t')) fail('wrong indent')
      if (isBlank(line)) {
        i++
        continue
      }
      break
    }
  }

  skipBlanks()
  if (i >= n) fail('empty file')

  const releases: MutableRelease[] = []
  const seen = new Set<string>()

  while (i < n) {
    skipBlanks()
    if (i >= n) break
    const heading = lines[i]
    if (heading.includes('\t')) fail('wrong indent')
    if (isExtra(heading)) fail('extra construct')
    if (!heading.startsWith('# ')) fail('extra construct')
    const rest = heading.slice(2)
    const sp = rest.indexOf(' ')
    if (rest === '' || sp === 0) fail('missing id')
    if (sp === -1) fail('missing name')
    const id = rest.slice(0, sp)
    const name = rest.slice(sp + 1)
    if (id === '') fail('missing id')
    if (name === '') fail('missing name')
    if (seen.has(id)) fail('duplicate id')
    seen.add(id)
    i++

    skipBlanks()
    if (i >= n) fail('missing summary')
    const summaryParts: string[] = []
    while (i < n) {
      const line = lines[i]
      if (line.includes('\t')) fail('wrong indent')
      if (isBlank(line)) break
      if (isExtra(line)) fail('extra construct')
      if (line.startsWith('# ')) break
      if (listItem(line) !== undefined) break
      if (line.startsWith(' ') || line.startsWith('-')) fail('extra construct')
      summaryParts.push(line)
      i++
    }
    if (summaryParts.length === 0) fail('missing summary')
    const summary = summaryParts.join(' ')

    const changes: MutableChange[] = []
    let current: MutableChange | undefined
    let nested: MutableChange | undefined

    skipBlanks()
    while (i < n) {
      const line = lines[i]
      if (line.includes('\t')) fail('wrong indent')
      if (isBlank(line)) {
        i++
        continue
      }
      if (isExtra(line)) fail('extra construct')
      if (line.startsWith('# ')) break
      const item = listItem(line)
      if (item === undefined) fail('extra construct')
      if (item.indent === 0) {
        const parsed = takeKind(item.body)
        current = makeChange(parsed.kind, parsed.text)
        nested = undefined
        changes.push(current)
      } else if (item.indent === 2) {
        if (current === undefined) fail('extra construct')
        if (kindPrefix(item.body) !== undefined) {
          if (current.kind !== 'major-feature') fail('nested Change under non-major-feature')
          const parsed = takeKind(item.body)
          nested = makeChange(parsed.kind, parsed.text)
          current.changes.push(nested)
        } else {
          if (item.body === '') fail('empty note')
          nested = undefined
          current.notes.push(item.body)
        }
      } else {
        if (nested === undefined) fail('extra construct')
        if (kindPrefix(item.body) !== undefined) fail('extra construct')
        if (item.body === '') fail('empty note')
        nested.notes.push(item.body)
      }
      i++
    }

    releases.push({ id, name, summary, changes })
  }

  if (releases.length === 0) fail('empty file')
  return releases
}

const TOP_LINE = /^(New|Added|Removed|Changed|Fixed bug) (building|item|ui|mechanic|multiplayer)\b/

export function topLineShape(text: string): boolean {
  return TOP_LINE.test(text)
}

export const RELEASES = parseChangelog(src)
