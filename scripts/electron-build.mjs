import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const version = readFileSync(join(root, 'docs/GLOBAL_VERSION.md'), 'utf8').match(/^\d+\.\d+\.\d+$/m)?.[0]
if (!version) throw new Error('no version in docs/GLOBAL_VERSION.md')

execFileSync(
  process.execPath,
  [join(root, 'node_modules/electron-builder/cli.js'), `--config.extraMetadata.version=${version}`, ...process.argv.slice(2)],
  { cwd: root, stdio: 'inherit' },
)
