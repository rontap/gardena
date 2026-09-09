import { readFileSync } from 'node:fs'

const PATH_FILES = ['docs/GLOBAL_VERSION.md', 'src/game/ui/changelog.md']
const CONST_FILES = [
  { file: 'src/game/sim/feature-save/save.ts', re: /SAVE_VERSION/ },
  { file: 'src/game/sim/mp.ts', re: /PROTOCOL/ },
]
const REASON =
  'AGENTS.md: only the orchestrator writes version text or release notes — GLOBAL_VERSION, the wordmark, SAVE_VERSION, dump version, PROTOCOL, changelog.md. A child may do so only when the task explicitly requires it and the user explicitly allowed it. Approve only if this turn asked for a version bump or release notes.'

function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: reason,
      },
    }),
  )
  process.exit(0)
}

let payload = ''
try {
  payload = readFileSync(0, 'utf8')
} catch {
  process.exit(0)
}
if (payload.trim() === '') process.exit(0)

let input
try {
  input = JSON.parse(payload)
} catch {
  ask(`The version guard could not read this tool call. ${REASON}`)
}

const target = input?.tool_input?.file_path
if (typeof target !== 'string') process.exit(0)
const norm = target.replace(/\\/g, '/')

if (PATH_FILES.some(f => norm.endsWith(f))) ask(`${norm} is version text. ${REASON}`)

const hit = CONST_FILES.find(c => norm.endsWith(c.file))
if (hit !== undefined) {
  const body = [input?.tool_input?.new_string, input?.tool_input?.content].filter(s => typeof s === 'string').join('\n')
  if (hit.re.test(body)) ask(`This edit touches the version constant in ${norm}. ${REASON}`)
}

process.exit(0)
