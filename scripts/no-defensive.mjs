import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = join(root, 'src')

const banned = [
  /typeof\s+[^;=()\n]+\s*[!=]==/,
  /typeof\s*\([^)]*\)\s*[!=]==/,
  /Array\.isArray\s*\(/,
  /Number\.isFinite\s*\(/,
]

const hits = []

function scan(dir, rel) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist') continue
    const nextRel = rel ? `${rel}/${ent.name}` : ent.name
    if (nextRel === 'paraglide' || nextRel.startsWith('paraglide/')) continue
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      scan(p, nextRel)
      continue
    }
    if (!ent.name.endsWith('.ts') && !ent.name.endsWith('.tsx')) continue
    const lines = readFileSync(p, 'utf8').split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (banned.some((re) => re.test(lines[i]))) hits.push(`src/${nextRel}:${i + 1}: ${lines[i].trim()}`)
    }
  }
}

scan(src, '')

if (hits.length) {
  for (const h of hits) console.log(h)
  console.log(`Your changes introduced 'typeof' and 'Array.isArray' checks. These are ABSOLUTELY PROHIBITED, for ANY REASON, EVER, IN ANY PART of the code.
These constitute DEFENSIVE CODING which is expressly disallowed in any member. Internal code should be self-consistent, completely type-save. 
Save-files are considered gold and to contain the EXACT expected internal types, therefore any type marshalling from save files is COMPLETELY unnecesary and PROHIBITED.
You are not allowed to circumvent, invent other mechanicms. There are NO exceptions to this rule, no external libraries.
You should IMMEDIATELY fix this blocker and NEVER hand-out type marshalling code from your hand.
Failure to do so will yield in your changes being reverted by the orchestrator and you being penalized.`)
  process.exit(1)
}
