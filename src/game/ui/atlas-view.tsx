import { useEffect, useState, type ReactNode } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import type { VfxId } from '../sim/ids.ts'
import { VFX } from '../view/vfx.ts'
import { EDGE_PAD } from '../view/camera.ts'
import { svgGroupIds, svgInner, svgViewBox } from '../view/svgs.ts'
import { Chrome } from './frame.tsx'

const RAW = import.meta.glob('../../assets/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

const PREFIX = '../../assets/'

function folderOf(path: string): string {
  const rest = path.slice(PREFIX.length)
  const cut = rest.lastIndexOf('/')
  return cut < 0 ? 'root' : rest.slice(0, cut)
}

type Asset = { name: string; folder: string; raw: string }

const ASSETS: readonly Asset[] = Object.entries(RAW).map(([path, raw]) => ({
  name: path.slice(path.lastIndexOf('/') + 1, -4),
  folder: folderOf(path),
  raw,
}))

const BY_NAME = new Map(ASSETS.map(a => [a.name, a.raw]))

function fileRaw(name: string): string {
  const found = BY_NAME.get(name)
  if (found === undefined) throw new Error(name)
  return found
}

function groupOuter(raw: string, id: string): string {
  const at = raw.indexOf(`id="${id}"`)
  const open = raw.lastIndexOf('<g', at)
  const end = raw.indexOf('</g>', at)
  return raw.slice(open, end + 4)
}

const UNIT = 5
const CAP = 10

function padded(name: string): boolean {
  return name.endsWith('-edge') || name.endsWith('-inset')
}

function viewBoxOf(asset: Asset): string {
  const vb = svgViewBox(asset.raw)
  if (!padded(asset.name)) return vb
  const size = vbSize(vb)
  return `${-EDGE_PAD} ${-EDGE_PAD} ${size.w + EDGE_PAD * 2} ${size.h + EDGE_PAD * 2}`
}

function vbSize(vb: string): { w: number; h: number } {
  const parts = vb.split(/\s+/)
  return { w: Number(parts[2]!), h: Number(parts[3]!) }
}

function box(vb: string): { w: number; h: number } {
  const size = vbSize(vb)
  const w = (size.w / 24) * UNIT
  const h = (size.h / 24) * UNIT
  const k = Math.min(1, CAP / w, CAP / h)
  return { w: w * k, h: h * k }
}

type Look = { kind: 'file'; file: string } | { kind: 'group'; file: string; id: string }

function lookBody(look: Look): string {
  const raw = fileRaw(look.file)
  return look.kind === 'file' ? svgInner(raw) : groupOuter(raw, look.id)
}

const FOLDER_ORDER = ['tiles', 'props', 'crops', 'fruits', 'items', 'joints', 'market', 'skills', 'ui', 'vfx', 'root']

type Section = { folder: string; assets: readonly Asset[] }

const SECTIONS: readonly Section[] = [
  ...FOLDER_ORDER,
  ...[...new Set(ASSETS.map(a => a.folder))].filter(f => !FOLDER_ORDER.includes(f)).sort(),
]
  .map(folder => ({ folder, assets: ASSETS.filter(a => a.folder === folder).sort((a, b) => a.name.localeCompare(b.name)) }))
  .filter(s => s.assets.length > 0)

const VFX_FILE: Record<VfxId, string> = {
  'sprinkler-spray': 'vfx-spray',
  'sprinkler-spray-large': 'vfx-spray-large',
  'sprinkler-spray-vert': 'vfx-spray-vert',
  tend: 'vfx-tend',
  pour: 'vfx-pour',
  brew: 'vfx-brew',
  dust: 'vfx-dust',
  steam: 'vfx-steam',
  dig: 'vfx-dig',
  furnace: 'vfx-furnace',
  'furnace-smoke': 'vfx-furnace-smoke',
  graft: 'vfx-graft',
  age: 'vfx-age',
  grind: 'vfx-grind',
  station: 'vfx-station',
  exhaust: 'vfx-exhaust',
  'burrow-pop': 'vfx-burrow-pop',
}

type Pair = { look: Look; vfx: VfxId; dx: number; dy: number }

const PAIRS: readonly Pair[] = [
  { look: { kind: 'group', file: 'prop-furnace', id: 'on' }, vfx: 'furnace', dx: 0, dy: 1 },
  { look: { kind: 'group', file: 'prop-furnace', id: 'on' }, vfx: 'furnace-smoke', dx: 0, dy: 0 },
  { look: { kind: 'group', file: 'prop-mill', id: 'body' }, vfx: 'dust', dx: 0.5, dy: 1.65 },
  { look: { kind: 'file', file: 'prop-jam' }, vfx: 'dust', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-still' }, vfx: 'steam', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-barrel' }, vfx: 'brew', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-barrel' }, vfx: 'age', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-sprinkler' }, vfx: 'sprinkler-spray', dx: 0.5, dy: 0.5 },
  { look: { kind: 'file', file: 'prop-sprinkler-large' }, vfx: 'sprinkler-spray-large', dx: 0.5, dy: 0.5 },
  { look: { kind: 'file', file: 'prop-sprinkler-vert' }, vfx: 'sprinkler-spray-vert', dx: 0.5, dy: 0.5 },
  { look: { kind: 'file', file: 'tile-dirt-0' }, vfx: 'dig', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'tile-dirt-0' }, vfx: 'pour', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'tile-grass-0' }, vfx: 'tend', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-burrow' }, vfx: 'burrow-pop', dx: 0, dy: 0 },
  { look: { kind: 'group', file: 'prop-apple-tree', id: 'unripe' }, vfx: 'graft', dx: 0, dy: 1 },
  { look: { kind: 'file', file: 'prop-grinder' }, vfx: 'grind', dx: 0, dy: 0 },
  { look: { kind: 'group', file: 'prop-research-station', id: 'on' }, vfx: 'station', dx: 0, dy: 0 },
  { look: { kind: 'file', file: 'prop-tractor' }, vfx: 'exhaust', dx: 0.5, dy: 0.5 },
]

function Face({ body, vb }: { body: string; vb: string }) {
  const b = box(vb)
  return (
    <svg
      viewBox={vb}
      style={{ width: `${b.w}rem`, height: `${b.h}rem` }}
      className="shrink-0"
      shapeRendering="crispEdges"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  )
}

function Tile({ file, id, children }: { file: string; id: string; children: ReactNode }) {
  return (
    <div className="flex w-48 flex-col items-center gap-1 bg-dirt/25 px-2 py-2">
      <div className="flex h-44 w-full items-center justify-center">{children}</div>
      <span className="text-center text-[11px] leading-tight text-ink/60">{file}</span>
      <span className="text-center text-xs leading-tight font-semibold">{id}</span>
    </div>
  )
}

function frameOf(id: VfxId, now: number): number {
  const def = VFX[id]
  return Math.floor(((now / 1000 / def.dur) % 1) * def.slots)
}

function PairTile({ pair, now }: { pair: Pair; now: number }) {
  const propVb = svgViewBox(fileRaw(pair.look.file))
  const b = box(propVb)
  const scale = b.w / vbSize(propVb).w
  const def = VFX[pair.vfx]
  const frame = frameOf(pair.vfx, now)
  const raw = fileRaw(VFX_FILE[pair.vfx])
  const off = def.anchor === 'vertex' ? { x: def.span / 2, y: def.tall / 2 } : { x: 0, y: 0 }
  return (
    <Tile file={pair.look.file} id={pair.vfx}>
      <div className="relative" style={{ width: `${b.w}rem`, height: `${b.h}rem` }}>
        <Face body={lookBody(pair.look)} vb={propVb} />
        {frame < def.frames && (
          <svg
            viewBox={svgViewBox(raw)}
            className="pointer-events-none absolute overflow-visible"
            style={{
              left: `${(pair.dx * 24 - off.x) * scale}rem`,
              top: `${(pair.dy * 24 - off.y) * scale}rem`,
              width: `${def.span * scale}rem`,
              height: `${def.tall * scale}rem`,
            }}
            shapeRendering="crispEdges"
            dangerouslySetInnerHTML={{ __html: groupOuter(raw, `f${frame}`) }}
          />
        )}
      </div>
    </Tile>
  )
}

function Shelf({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display text-sm">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

type Cell = { file: string; id: string; body: string; vb: string }

function cellsOf(asset: Asset): Cell[] {
  const vb = viewBoxOf(asset)
  const ids = svgGroupIds(asset.raw)
  if (ids.length === 0) return [{ file: asset.name, id: 'whole', body: svgInner(asset.raw), vb }]
  return ids.map(id => ({ file: asset.name, id, body: groupOuter(asset.raw, id), vb }))
}

export function AtlasView() {
  const [vfxOn, setVfxOn] = useState(false)
  const [q, setQ] = useState('')
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!vfxOn) return
    const h = setInterval(() => setNow(performance.now()), 50)
    return () => clearInterval(h)
  }, [vfxOn])

  return (
    <div className="h-screen overflow-y-auto scroll-pane bg-ink p-4">
      <div className="relative mx-auto w-full max-w-[86rem]">
        <Chrome className="relative px-4 py-3">
          <div className="relative z-20 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="font-display text-lg">#atlas</div>
              <div className="text-xs text-ink/60">{ASSETS.length} files</div>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="filter"
                aria-label="filter"
                className="w-56 border-2 border-ink/30 bg-parch px-2 py-1 text-sm outline-none focus-visible:border-ink"
              />
              <label className="ml-auto flex cursor-pointer items-center gap-2">
                <Checkbox.Root
                  checked={vfxOn}
                  aria-label="VFX"
                  onCheckedChange={v => setVfxOn(v === true)}
                  className="size-4 shrink-0 cursor-pointer border-2 border-ink/30 bg-parch outline-none data-[state=checked]:border-ink data-[state=checked]:bg-ink"
                >
                  <Checkbox.Indicator className="flex items-center justify-center text-house">
                    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
                      <path d="M2 6.5 L4.75 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm">VFX</span>
              </label>
            </div>
            {vfxOn && (
              <Shelf title="vfx on props">
                {PAIRS.map(p => (
                  <PairTile key={`${p.look.file}:${p.vfx}`} pair={p} now={now} />
                ))}
              </Shelf>
            )}
            {SECTIONS.map(s => ({ folder: s.folder, assets: s.assets.filter(a => a.name.includes(q)) }))
              .filter(s => s.assets.length > 0)
              .map(s => (
              <Shelf key={s.folder} title={s.folder}>
                {s.assets.flatMap(cellsOf).map(c => (
                  <Tile key={`${c.file}:${c.id}`} file={c.file} id={c.id}>
                    <Face body={c.body} vb={c.vb} />
                  </Tile>
                ))}
              </Shelf>
            ))}
          </div>
        </Chrome>
      </div>
    </div>
  )
}
