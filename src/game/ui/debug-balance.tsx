import { CROP_NAME, cropVariety } from '../defs/crops.ts'
import type { Purpose } from '../defs/varieties.ts'
import * as Checkbox from '@radix-ui/react-checkbox'
import { useMemo, useState, type ReactNode } from 'react'
import { Btn, Chrome } from './frame.tsx'
import {
  ORIGIN,
  ORIGIN_CROP,
  cellParity,
  compute,
  parityOk,
  sameState,
  snapshot,
  toCsv,
  type BalanceState,
  type CropEdit,
  type Globals,
  type Row,
} from './debug-balance.ts'

const numClass =
  'w-[4.75rem] select-text border-2 border-ink/30 bg-parch px-1 py-0.5 font-mono text-xs tabular-nums text-ink outline-none focus:border-ink'
const numWide =
  'w-full select-text border-2 border-ink/30 bg-parch px-1 py-0.5 font-mono text-xs tabular-nums text-ink outline-none focus:border-ink'
const th = 'px-1.5 py-1 text-left font-semibold text-ink/60 whitespace-nowrap'
const td = 'px-1.5 py-0.5 whitespace-nowrap align-middle'
const sticky = 'sticky left-0 z-10 bg-house'

function fmt(n: number | null, d = 3): string {
  if (n === null) return '—'
  const x = Number(n.toFixed(d))
  return Object.is(x, -0) ? '0' : String(x)
}

function Num({
  value,
  onChange,
  dirty,
  min,
  wide,
}: {
  value: number
  onChange: (n: number) => void
  dirty?: boolean
  min?: number
  wide?: boolean
}) {
  return (
    <input
      type="number"
      min={min}
      step="any"
      value={value}
      className={`${wide === true ? numWide : numClass} ${dirty === true ? 'border-ripe' : ''}`}
      onChange={e => {
        const n = Number(e.target.value)
        if (e.target.value === '' || n !== n) return
        if (min !== undefined && n < min) return
        onChange(n)
      }}
    />
  )
}

function Pct({
  value,
  onChange,
  dirty,
  max = 200,
  wide,
}: {
  value: number
  onChange: (n: number) => void
  dirty?: boolean
  max?: number
  wide?: boolean
}) {
  const pct = Number((value * 100).toFixed(4))
  return (
    <span className={`inline-flex items-center gap-1 ${wide === true ? 'w-full' : ''}`}>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={pct}
        className={wide === true ? 'min-w-0 flex-1 accent-dirt' : 'w-16 accent-dirt'}
        onChange={e => onChange(Number(e.target.value) / 100)}
      />
      <Num value={pct} dirty={dirty} min={0} onChange={n => onChange(n / 100)} />
      <span className="text-ink/45">%</span>
    </span>
  )
}

function Calc({ n, d = 3, ok = true }: { n: number | null; d?: number; ok?: boolean }) {
  return <span className={`font-mono tabular-nums ${ok ? '' : 'text-lens-bad'}`}>{fmt(n, d)}</span>
}

function Vs({ n, vs, d = 3, ok = true }: { n: number | null; vs: number | null; d?: number; ok?: boolean }) {
  if (n === null) return <span className="text-ink/35">—</span>
  if (vs === null || vs === 0 || n === vs) return <Calc n={n} d={d} ok={ok} />
  const pct = ((n - vs) / vs) * 100
  const better = n > vs
  return (
    <span className="inline-flex items-baseline gap-1">
      <Calc n={n} d={d} ok={ok} />
      <span className={`font-mono text-[11px] ${better ? 'text-grass-dark' : 'text-roof'}`}>
        {better ? '⬆️' : '❌'} ({better ? '+' : ''}
        {fmt(pct, 1)}%)
      </span>
    </span>
  )
}

function Field({ k, children }: { k: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      <span className="leading-tight text-ink/60">{k}</span>
      {children}
    </label>
  )
}

function Cat({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
      <div className="font-display text-[11px] text-ink/70">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

type Highlight = 'off' | 'prefs' | 'best'

function fit(row: Row, path: Purpose, n: number | null): string {
  if (n === null || row.purpose === 'base') return ''
  return row.purpose === path ? 'bg-grass/25' : 'bg-roof/20'
}

function scaleOf(ns: readonly (number | null)[]): (number | null)[] {
  const xs = ns.flatMap(x => (x === null ? [] : [x]))
  if (xs.length === 0) return ns.map(() => null)
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  if (lo === hi) return ns.map(x => (x === null ? null : 0.5))
  return ns.map(x => (x === null ? null : (x - lo) / (hi - lo)))
}

function scaleStyle(t: number): { backgroundColor: string } {
  const p = Math.abs(t - 0.5) * 50
  const col = t >= 0.5 ? 'var(--color-grass)' : 'var(--color-roof)'
  return { backgroundColor: `color-mix(in srgb, ${col} ${p}%, var(--color-house))` }
}

function Td({
  children,
  highlight,
  row,
  path,
  n,
  t,
  invert,
}: {
  children: ReactNode
  highlight: Highlight
  row: Row
  path?: Purpose
  n: number | null
  t?: number | null
  invert?: boolean
}) {
  let cls = td
  let style: { backgroundColor: string } | undefined
  if (highlight === 'prefs' && path !== undefined) cls = `${td} ${fit(row, path, n)}`
  if (highlight === 'best' && t !== null && t !== undefined) {
    const u = invert === true ? 1 - t : t
    style = scaleStyle(u)
  }
  return (
    <td className={cls} style={style}>
      {children}
    </td>
  )
}

function Check({
  on,
  label,
  onChange,
}: {
  on: boolean
  label: string
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Checkbox.Root
        checked={on}
        aria-label={label}
        onCheckedChange={v => onChange(v === true)}
        className="size-4 shrink-0 cursor-pointer border-2 border-ink/30 bg-parch outline-none data-[state=checked]:border-ink data-[state=checked]:bg-ink"
      >
        <Checkbox.Indicator className="flex items-center justify-center text-house">
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
            <path d="M2 6.5 L4.75 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span className="text-sm">{label}</span>
    </label>
  )
}

function downloadCsv(state: BalanceState, rows: Row[]): void {
  const blob = new Blob([toCsv(rows, state.g)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'crop-stats.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function DebugBalance() {
  const [state, setState] = useState<BalanceState>(() => snapshot())
  const [showVarieties, setShowVarieties] = useState(false)
  const [highlight, setHighlight] = useState<Highlight>('off')
  const { rows, offDays, treeF } = useMemo(() => compute(state), [state])
  const pristine = sameState(state, ORIGIN)
  const g = state.g
  const og = ORIGIN.g
  const shown = showVarieties ? rows : rows.filter(r => r.variety === 'base')
  const broken = shown.some(r => parityOk(r, pristine) === false)

  const setG = (patch: Partial<Globals>) =>
    setState(s => {
      const g = { ...s.g, ...patch }
      const mill = patch.sugarMill
      if (mill === undefined) return { ...s, g }
      return {
        ...s,
        g,
        crops: s.crops.map(c => (c.id === 'sugar-cane' ? { ...c, millSale: mill * g.sugarBag } : c)),
      }
    })
  const setCrop = (id: CropEdit['id'], patch: Partial<CropEdit>) =>
    setState(s => ({ ...s, crops: s.crops.map(c => (c.id === id ? { ...c, ...patch } : c)) }))
  const setGrow = (tier: 'base' | 'variant' | 'heirloom', n: number) =>
    setState(s => ({ ...s, g: { ...s.g, varietyGrow: { ...s.g.varietyGrow, [tier]: n } } }))
  const setTol = (tier: 'base' | 'variant' | 'heirloom', n: number) =>
    setState(s => ({ ...s, g: { ...s.g, varietyTol: { ...s.g.varietyTol, [tier]: n } } }))
  const setRot = (tier: 'base' | 'variant' | 'heirloom', n: number) =>
    setState(s => ({ ...s, g: { ...s.g, varietyRot: { ...s.g.varietyRot, [tier]: n } } }))
  const setPurpose = (tier: 'variant' | 'heirloom', key: 'on' | 'off', n: number) =>
    setState(s => ({
      ...s,
      g: { ...s.g, purpose: { ...s.g.purpose, [tier]: { ...s.g.purpose[tier], [key]: n } } },
    }))

  const groups = state.crops.map(c => ({
    c,
    rows: shown.filter(r => r.id === c.id),
  }))
  const sc = {
    fruitSale: scaleOf(shown.map(r => r.fruitSale)),
    preserveSale: scaleOf(shown.map(r => (r.jamSale !== null ? r.jamSale : r.millSale))),
    alcoholSale: scaleOf(shown.map(r => r.alcoholSale)),
    alcoholAgedSale: scaleOf(shown.map(r => r.alcoholAgedSale)),
    produceCpm: scaleOf(shown.map(r => r.produceCpm)),
    preserveCpm: scaleOf(shown.map(r => (r.jamCpm !== null ? r.jamCpm : r.millCpm))),
    alcoholCpm: scaleOf(shown.map(r => r.alcoholCpm)),
    alcoholAgedCpm: scaleOf(shown.map(r => r.alcoholAgedCpm)),
    fieldClicks: scaleOf(shown.map(r => r.fieldClicks)),
    produceClicks: scaleOf(shown.map(r => r.produceClicks)),
    preserveClicks: scaleOf(shown.map(r => (r.jamClicks !== null ? r.jamClicks : r.millClicks))),
    alcoholClicks: scaleOf(shown.map(r => r.alcoholClicks)),
    alcoholAgedClicks: scaleOf(shown.map(r => r.alcoholAgedClicks)),
    coinPerClickProduce: scaleOf(shown.map(r => r.coinPerClickProduce)),
    coinPerClickPreserve: scaleOf(shown.map(r => (r.coinPerClickJam !== null ? r.coinPerClickJam : r.coinPerClickMill))),
    coinPerClickAlcohol: scaleOf(shown.map(r => r.coinPerClickAlcohol)),
    coinPerClickAlcoholAged: scaleOf(shown.map(r => r.coinPerClickAlcoholAged)),
  }

  return (
    <div className="h-screen overflow-hidden bg-ink p-4">
      <Chrome className="relative flex h-full flex-col px-4 py-3">
        <div className="relative z-20 flex min-h-0 flex-1 gap-4">
          <aside className="scroll-pane flex w-[24rem] shrink-0 flex-col gap-3 overflow-y-auto border-r border-ink/15 pr-3">
            <div className="font-display text-lg">#debug-balance</div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => setState(snapshot())}>Revert to default</Btn>
              <Btn onClick={() => downloadCsv(state, rows)}>CSV</Btn>
            </div>
            <Check on={showVarieties} label="Show varieties" onChange={setShowVarieties} />
            <Check
              on={highlight === 'prefs'}
              label="Show variety preferences"
              onChange={v => setHighlight(v ? 'prefs' : 'off')}
            />
            <Check
              on={highlight === 'best'}
              label="Show best"
              onChange={v => setHighlight(v ? 'best' : 'off')}
            />
            <span className="text-xs text-ink/45">
              Season mix {fmt(treeF)} · Off-season days {fmt(offDays)}
              {pristine ? ' · live numbers' : ' · edited'}
              {broken ? ' · calc mismatch' : ''}
            </span>

            <Cat title="Day and Quality">
              <Pair>
                <Field k="Day length">
                  <Num wide value={g.daySeconds} dirty={g.daySeconds !== og.daySeconds} min={0} onChange={n => setG({ daySeconds: n })} />
                </Field>
                <Field k="Fruit Quality">
                  <Pct wide value={g.quality} max={100} dirty={g.quality !== og.quality} onChange={n => setG({ quality: n })} />
                </Field>
              </Pair>
              <Field k="Full Quality sale">
                <Pct wide value={g.qualityTop} max={400} dirty={g.qualityTop !== og.qualityTop} onChange={n => setG({ qualityTop: n })} />
              </Field>
            </Cat>

            <Cat title="Water">
              <Pair>
                <Field k="Till water">
                  <Num wide value={g.startWater} dirty={g.startWater !== og.startWater} min={0} onChange={n => setG({ startWater: n })} />
                </Field>
                <Field k="Wanted water">
                  <Num
                    wide
                    value={g.soilWaterMid}
                    dirty={g.soilWaterMid !== og.soilWaterMid}
                    min={0}
                    onChange={n => setG({ soilWaterMid: n })}
                  />
                </Field>
              </Pair>
              <Field k="Narrowest band">
                <Num wide value={g.tolMin} dirty={g.tolMin !== og.tolMin} min={0} onChange={n => setG({ tolMin: n })} />
              </Field>
            </Cat>

            <Cat title="Fertilizer">
              <div className="flex gap-1">
                <Btn selected={g.fertPaid === false} onClick={() => setG({ fertPaid: false })} className="text-xs">
                  Compost
                </Btn>
                <Btn selected={g.fertPaid} onClick={() => setG({ fertPaid: true })} className="text-xs">
                  Fertilizer
                </Btn>
              </div>
              <Field k="Fertilizer per second">
                <Num wide value={g.fertDraw} dirty={g.fertDraw !== og.fertDraw} min={0} onChange={n => setG({ fertDraw: n })} />
              </Field>
              <Pair>
                <Field k="Bag litres">
                  <Num
                    wide
                    value={g.fertBagLiters}
                    dirty={g.fertBagLiters !== og.fertBagLiters}
                    min={0}
                    onChange={n => setG({ fertBagLiters: n })}
                  />
                </Field>
                <Field k="Bag money">
                  <Num wide value={g.fertCost} dirty={g.fertCost !== og.fertCost} min={0} onChange={n => setG({ fertCost: n })} />
                </Field>
              </Pair>
            </Cat>

            <Cat title="Variety">
              <Pair>
                <Field k="Named on-purpose sale">
                  <Pct
                    wide
                    max={300}
                    value={g.purpose.variant.on}
                    dirty={g.purpose.variant.on !== og.purpose.variant.on}
                    onChange={n => setPurpose('variant', 'on', n)}
                  />
                </Field>
                <Field k="Named off-purpose sale">
                  <Pct
                    wide
                    max={150}
                    value={g.purpose.variant.off}
                    dirty={g.purpose.variant.off !== og.purpose.variant.off}
                    onChange={n => setPurpose('variant', 'off', n)}
                  />
                </Field>
              </Pair>
              <Pair>
                <Field k="Heirloom on-purpose sale">
                  <Pct
                    wide
                    max={300}
                    value={g.purpose.heirloom.on}
                    dirty={g.purpose.heirloom.on !== og.purpose.heirloom.on}
                    onChange={n => setPurpose('heirloom', 'on', n)}
                  />
                </Field>
                <Field k="Heirloom off-purpose sale">
                  <Pct
                    wide
                    max={150}
                    value={g.purpose.heirloom.off}
                    dirty={g.purpose.heirloom.off !== og.purpose.heirloom.off}
                    onChange={n => setPurpose('heirloom', 'off', n)}
                  />
                </Field>
              </Pair>
              <Pair>
                <Field k="Plain grow time">
                  <Pct wide max={150} value={g.varietyGrow.base} dirty={g.varietyGrow.base !== og.varietyGrow.base} onChange={n => setGrow('base', n)} />
                </Field>
                <Field k="Named grow time">
                  <Pct
                    wide
                    max={150}
                    value={g.varietyGrow.variant}
                    dirty={g.varietyGrow.variant !== og.varietyGrow.variant}
                    onChange={n => setGrow('variant', n)}
                  />
                </Field>
              </Pair>
              <Field k="Heirloom grow time">
                <Pct
                  wide
                  max={150}
                  value={g.varietyGrow.heirloom}
                  dirty={g.varietyGrow.heirloom !== og.varietyGrow.heirloom}
                  onChange={n => setGrow('heirloom', n)}
                />
              </Field>
              <Pair>
                <Field k="Plain water-fert band">
                  <Pct wide max={150} value={g.varietyTol.base} dirty={g.varietyTol.base !== og.varietyTol.base} onChange={n => setTol('base', n)} />
                </Field>
                <Field k="Named water-fert band">
                  <Pct
                    wide
                    max={150}
                    value={g.varietyTol.variant}
                    dirty={g.varietyTol.variant !== og.varietyTol.variant}
                    onChange={n => setTol('variant', n)}
                  />
                </Field>
              </Pair>
              <Field k="Heirloom water-fert band">
                <Pct
                  wide
                  max={150}
                  value={g.varietyTol.heirloom}
                  dirty={g.varietyTol.heirloom !== og.varietyTol.heirloom}
                  onChange={n => setTol('heirloom', n)}
                />
              </Field>
              <Pair>
                <Field k="Plain time to rot">
                  <Pct wide max={150} value={g.varietyRot.base} dirty={g.varietyRot.base !== og.varietyRot.base} onChange={n => setRot('base', n)} />
                </Field>
                <Field k="Named time to rot">
                  <Pct
                    wide
                    max={150}
                    value={g.varietyRot.variant}
                    dirty={g.varietyRot.variant !== og.varietyRot.variant}
                    onChange={n => setRot('variant', n)}
                  />
                </Field>
              </Pair>
              <Field k="Heirloom time to rot">
                <Pct
                  wide
                  max={150}
                  value={g.varietyRot.heirloom}
                  dirty={g.varietyRot.heirloom !== og.varietyRot.heirloom}
                  onChange={n => setRot('heirloom', n)}
                />
              </Field>
            </Cat>

            <Cat title="Jam machine">
              <Pair>
                <Field k="Fruit needed">
                  <Num wide value={g.jamIn} dirty={g.jamIn !== og.jamIn} min={0} onChange={n => setG({ jamIn: n })} />
                </Field>
                <Field k="Jam seconds">
                  <Num wide value={g.jamSeconds} dirty={g.jamSeconds !== og.jamSeconds} min={0} onChange={n => setG({ jamSeconds: n })} />
                </Field>
              </Pair>
              <Pair>
                <Field k="Sugar litres">
                  <Num wide value={g.jamSugar} dirty={g.jamSugar !== og.jamSugar} min={0} onChange={n => setG({ jamSugar: n })} />
                </Field>
                <Field k="Ketchup sugar">
                  <Num wide value={g.ketchupSugar} dirty={g.ketchupSugar !== og.ketchupSugar} min={0} onChange={n => setG({ ketchupSugar: n })} />
                </Field>
              </Pair>
            </Cat>

            <Cat title="Mill">
              <Pair>
                <Field k="Fruit needed">
                  <Num wide value={g.millIn} dirty={g.millIn !== og.millIn} min={0} onChange={n => setG({ millIn: n })} />
                </Field>
                <Field k="Vanilla fruit">
                  <Num
                    wide
                    value={g.millVanillaIn}
                    dirty={g.millVanillaIn !== og.millVanillaIn}
                    min={0}
                    onChange={n => setG({ millVanillaIn: n })}
                  />
                </Field>
              </Pair>
              <Field k="Crush seconds">
                <Num wide value={g.millWork} dirty={g.millWork !== og.millWork} min={0} onChange={n => setG({ millWork: n })} />
              </Field>
            </Cat>

            <Cat title="Pot still">
              <Pair>
                <Field k="Fruit needed">
                  <Num wide value={g.stillCap} dirty={g.stillCap !== og.stillCap} min={0} onChange={n => setG({ stillCap: n })} />
                </Field>
                <Field k="Distill seconds">
                  <Num wide value={g.stillSeconds} dirty={g.stillSeconds !== og.stillSeconds} min={0} onChange={n => setG({ stillSeconds: n })} />
                </Field>
              </Pair>
            </Cat>

            <Cat title="Barrel">
              <Pair>
                <Field k="Mature seconds">
                  <Num wide value={g.barrelMature} dirty={g.barrelMature !== og.barrelMature} min={0} onChange={n => setG({ barrelMature: n })} />
                </Field>
                <Field k="Age seconds">
                  <Num wide value={g.barrelAge} dirty={g.barrelAge !== og.barrelAge} min={0} onChange={n => setG({ barrelAge: n })} />
                </Field>
              </Pair>
              <Pair>
                <Field k="Plain age sale">
                  <Pct wide max={400} value={g.caskAgeMin} dirty={g.caskAgeMin !== og.caskAgeMin} onChange={n => setG({ caskAgeMin: n })} />
                </Field>
                <Field k="Heirloom age sale">
                  <Pct wide max={400} value={g.caskAgeMax} dirty={g.caskAgeMax !== og.caskAgeMax} onChange={n => setG({ caskAgeMax: n })} />
                </Field>
              </Pair>
            </Cat>

            <Cat title="Sugar">
              <Field k="Bag litres">
                <Num wide value={g.sugarBag} dirty={g.sugarBag !== og.sugarBag} min={0} onChange={n => setG({ sugarBag: n })} />
              </Field>
              <Pair>
                <Field k="Shop sugar">
                  <Num wide value={g.sugarShop} dirty={g.sugarShop !== og.sugarShop} min={0} onChange={n => setG({ sugarShop: n })} />
                </Field>
                <Field k="Mill sugar">
                  <Num wide value={g.sugarMill} dirty={g.sugarMill !== og.sugarMill} min={0} onChange={n => setG({ sugarMill: n })} />
                </Field>
              </Pair>
              <div className="flex gap-1">
                <Btn selected={g.sugarFromMill === false} onClick={() => setG({ sugarFromMill: false })} className="text-xs">
                  Shop sugar
                </Btn>
                <Btn selected={g.sugarFromMill} onClick={() => setG({ sugarFromMill: true })} className="text-xs">
                  Mill sugar
                </Btn>
              </div>
            </Cat>

            <Cat title="Trees">
              <Pair>
                <Field k="On-season days">
                  <Num
                    wide
                    value={g.treeYieldDays}
                    dirty={g.treeYieldDays !== og.treeYieldDays}
                    min={0}
                    onChange={n => setG({ treeYieldDays: n })}
                  />
                </Field>
                <Field k="On-season speed">
                  <Pct wide max={400} value={g.treeYieldMul} dirty={g.treeYieldMul !== og.treeYieldMul} onChange={n => setG({ treeYieldMul: n })} />
                </Field>
              </Pair>
              <Pair>
                <Field k="Off-season speed">
                  <Pct wide max={150} value={g.treeOffMul} dirty={g.treeOffMul !== og.treeOffMul} onChange={n => setG({ treeOffMul: n })} />
                </Field>
                <Field k="Off-season start">
                  <Num wide value={g.offChanceStart} dirty={g.offChanceStart !== og.offChanceStart} onChange={n => setG({ offChanceStart: n })} />
                </Field>
              </Pair>
              <Field k="Off-season step">
                <Num wide value={g.offChanceStep} dirty={g.offChanceStep !== og.offChanceStep} onChange={n => setG({ offChanceStep: n })} />
              </Field>
            </Cat>

            <Cat title="Clicks">
              <Pair>
                <Field k="Buy pack">
                  <Num wide value={g.buyClicks} dirty={g.buyClicks !== og.buyClicks} min={0} onChange={n => setG({ buyClicks: n })} />
                </Field>
                <Field k="Plant">
                  <Num wide value={g.plantClicks} dirty={g.plantClicks !== og.plantClicks} min={0} onChange={n => setG({ plantClicks: n })} />
                </Field>
              </Pair>
              <Pair>
                <Field k="Harvest">
                  <Num
                    wide
                    value={g.harvestClicks}
                    dirty={g.harvestClicks !== og.harvestClicks}
                    min={0}
                    onChange={n => setG({ harvestClicks: n })}
                  />
                </Field>
                <Field k="Drop off">
                  <Num wide value={g.sellClicks} dirty={g.sellClicks !== og.sellClicks} min={0} onChange={n => setG({ sellClicks: n })} />
                </Field>
              </Pair>
              <Pair>
                <Field k="Machine">
                  <Num
                    wide
                    value={g.machineClicks}
                    dirty={g.machineClicks !== og.machineClicks}
                    min={0}
                    onChange={n => setG({ machineClicks: n })}
                  />
                </Field>
                <Field k="Sugar bag">
                  <Num
                    wide
                    value={g.sugarBagClicks}
                    dirty={g.sugarBagClicks !== og.sugarBagClicks}
                    min={0}
                    onChange={n => setG({ sugarBagClicks: n })}
                  />
                </Field>
              </Pair>
            </Cat>
          </aside>

          <main className="scroll-pane flex min-w-0 flex-1 flex-col gap-6 overflow-auto pl-1">

            <Table title="Constant settings">
              <thead>
                <tr>
                  <th className={`${th} ${sticky}`}>Crop</th>
                  <th className={th}>Pack money</th>
                  <th className={th}>Seeds in a pack</th>
                  <th className={th}>Money per seed</th>
                  <th className={th}>Water per second</th>
                  <th className={th}>Seconds to fruit</th>
                  <th className={th}>Seconds as a young tree</th>
                  <th className={th}>Fresh sale</th>
                  <th className={th}>Preserving sale</th>
                  <th className={th}>Alcohol sale</th>
                </tr>
              </thead>
              <tbody>
                {groups.flatMap(({ c, rows: rs }) =>
                  rs.map(r => {
                    const o = ORIGIN_CROP[c.id]
                    const base = r.variety === 'base'
                    return (
                      <tr key={`${c.id}:${r.variety}`} className="border-t border-ink/10">
                        <td className={`${td} ${sticky}`}>
                          <CropName row={r} />
                        </td>
                        <td className={td}>
                          {base === false || c.packPrice === null ? (
                            <Calc n={r.packPrice} d={2} />
                          ) : (
                            <Num
                              value={c.packPrice}
                              dirty={c.packPrice !== o.packPrice}
                              min={0}
                              onChange={n => setCrop(c.id, { packPrice: n })}
                            />
                          )}
                        </td>
                        <td className={td}>
                          {base === false || c.packUnits === null ? (
                            <Calc n={r.packUnits} d={0} />
                          ) : (
                            <Num
                              value={c.packUnits}
                              dirty={c.packUnits !== o.packUnits}
                              min={0}
                              onChange={n => setCrop(c.id, { packUnits: n })}
                            />
                          )}
                        </td>
                        <td className={td}>
                          <Calc n={r.costSeed} d={2} />
                        </td>
                        <td className={td}>
                          {base ? (
                            <Num
                              value={c.waterUsePerSec}
                              dirty={c.waterUsePerSec !== o.waterUsePerSec}
                              min={0}
                              onChange={n => setCrop(c.id, { waterUsePerSec: n })}
                            />
                          ) : (
                            <Calc n={r.waterUsePerSec} d={5} />
                          )}
                        </td>
                        <td className={td}>
                          {base ? (
                            <Num
                              value={c.fruitSeconds}
                              dirty={c.fruitSeconds !== o.fruitSeconds}
                              min={0}
                              onChange={n => setCrop(c.id, { fruitSeconds: n })}
                            />
                          ) : (
                            <Calc n={r.fruitSeconds} />
                          )}
                        </td>
                        <td className={td}>
                          {c.juvenileSeconds === null ? (
                            '—'
                          ) : base ? (
                            <Num
                              value={c.juvenileSeconds}
                              dirty={c.juvenileSeconds !== o.juvenileSeconds}
                              min={0}
                              onChange={n => setCrop(c.id, { juvenileSeconds: n })}
                            />
                          ) : (
                            <Calc n={r.juvenileSeconds} />
                          )}
                        </td>
                        <td className={td}>
                          {base ? (
                            <Num value={c.sale} dirty={c.sale !== o.sale} min={0} onChange={n => setCrop(c.id, { sale: n })} />
                          ) : (
                            <Calc n={c.sale} d={2} />
                          )}
                        </td>
                        <td className={td}>
                          {c.jamSale !== null ? (
                            base ? (
                              <Num
                                value={c.jamSale}
                                dirty={c.jamSale !== o.jamSale}
                                min={0}
                                onChange={n => setCrop(c.id, { jamSale: n })}
                              />
                            ) : (
                              <Calc n={c.jamSale} d={2} />
                            )
                          ) : c.millSale !== null ? (
                            base ? (
                              <Num
                                value={c.millSale}
                                dirty={c.millSale !== o.millSale}
                                min={0}
                                onChange={n => setCrop(c.id, { millSale: n })}
                              />
                            ) : (
                              <Calc n={c.millSale} d={2} />
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={td}>
                          {c.alcoholSale === null ? (
                            '—'
                          ) : base ? (
                            <Num
                              value={c.alcoholSale}
                              dirty={c.alcoholSale !== o.alcoholSale}
                              min={0}
                              onChange={n => setCrop(c.id, { alcoholSale: n })}
                            />
                          ) : (
                            <Calc n={c.alcoholSale} d={2} />
                          )}
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </Table>

            <Table title="Income and cost">
              <thead>
                <tr>
                  <th className={`${th} ${sticky}`}>Crop</th>
                  <th className={th}>Fresh sale</th>
                  <th className={th}>Preserving sale</th>
                  <th className={th}>Alcohol sale</th>
                  <th className={th}>Alcohol (max aged) sale</th>
                  <th className={th}>Fresh $/min</th>
                  <th className={th}>Preserving $/min</th>
                  <th className={th}>Alcohol $/min</th>
                  <th className={th}>Alcohol (max aged) $/min</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={`${r.id}:${r.variety}:inc`} className="border-t border-ink/10">
                    <td className={`${td} ${sticky}`}>
                      <CropName row={r} />
                    </td>
                    <Td highlight={highlight} row={r} path="produce" n={r.fruitSale} t={sc.fruitSale[i]}>
                      <Calc n={r.fruitSale} d={2} ok={cellParity(r.fruitSale, r.fruitSaleLive, pristine)} />
                    </Td>
                    <Td
                      highlight={highlight}
                      row={r}
                      path="processed"
                      n={r.jamSale !== null ? r.jamSale : r.millSale}
                      t={sc.preserveSale[i]}
                    >
                      <Vs
                        n={r.jamSale !== null ? r.jamSale : r.millSale}
                        vs={r.fruitSale}
                        d={2}
                        ok={cellParity(
                          r.jamSale !== null ? r.jamSale : r.millSale,
                          r.jamSaleLive !== null ? r.jamSaleLive : r.millSaleLive,
                          pristine,
                        )}
                      />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholSale} t={sc.alcoholSale[i]}>
                      <Vs n={r.alcoholSale} vs={r.fruitSale} d={2} ok={cellParity(r.alcoholSale, r.alcoholSaleLive, pristine)} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholAgedSale} t={sc.alcoholAgedSale[i]}>
                      <Vs
                        n={r.alcoholAgedSale}
                        vs={r.fruitSale}
                        d={2}
                        ok={cellParity(r.alcoholAgedSale, r.alcoholAgedSaleLive, pristine)}
                      />
                    </Td>
                    <Td highlight={highlight} row={r} path="produce" n={r.produceCpm} t={sc.produceCpm[i]}>
                      <Calc n={r.produceCpm} />
                    </Td>
                    <Td
                      highlight={highlight}
                      row={r}
                      path="processed"
                      n={r.jamCpm !== null ? r.jamCpm : r.millCpm}
                      t={sc.preserveCpm[i]}
                    >
                      <Vs n={r.jamCpm !== null ? r.jamCpm : r.millCpm} vs={r.produceCpm} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholCpm} t={sc.alcoholCpm[i]}>
                      <Vs n={r.alcoholCpm} vs={r.produceCpm} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholAgedCpm} t={sc.alcoholAgedCpm[i]}>
                      <Vs n={r.alcoholAgedCpm} vs={r.produceCpm} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Table title="Interaction costs">
              <thead>
                <tr>
                  <th className={`${th} ${sticky}`}>Crop</th>
                  <th className={th}>Field clicks</th>
                  <th className={th}>Fresh clicks</th>
                  <th className={th}>Preserving clicks</th>
                  <th className={th}>Alcohol clicks</th>
                  <th className={th}>Alcohol (max aged) clicks</th>
                  <th className={th}>Fresh $/click</th>
                  <th className={th}>Preserving $/click</th>
                  <th className={th}>Alcohol $/click</th>
                  <th className={th}>Alcohol (max aged) $/click</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={`${r.id}:${r.variety}:clk`} className="border-t border-ink/10">
                    <td className={`${td} ${sticky}`}>
                      <CropName row={r} />
                    </td>
                    <Td highlight={highlight} row={r} n={r.fieldClicks} t={sc.fieldClicks[i]} invert>
                      <Calc n={r.fieldClicks} />
                    </Td>
                    <Td highlight={highlight} row={r} path="produce" n={r.produceClicks} t={sc.produceClicks[i]} invert>
                      <Calc n={r.produceClicks} />
                    </Td>
                    <Td
                      highlight={highlight}
                      row={r}
                      path="processed"
                      n={r.jamClicks !== null ? r.jamClicks : r.millClicks}
                      t={sc.preserveClicks[i]}
                      invert
                    >
                      <Calc n={r.jamClicks !== null ? r.jamClicks : r.millClicks} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholClicks} t={sc.alcoholClicks[i]} invert>
                      <Calc n={r.alcoholClicks} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.alcoholAgedClicks} t={sc.alcoholAgedClicks[i]} invert>
                      <Calc n={r.alcoholAgedClicks} />
                    </Td>
                    <Td highlight={highlight} row={r} path="produce" n={r.coinPerClickProduce} t={sc.coinPerClickProduce[i]}>
                      <Calc n={r.coinPerClickProduce} />
                    </Td>
                    <Td
                      highlight={highlight}
                      row={r}
                      path="processed"
                      n={r.coinPerClickJam !== null ? r.coinPerClickJam : r.coinPerClickMill}
                      t={sc.coinPerClickPreserve[i]}
                    >
                      <Vs
                        n={r.coinPerClickJam !== null ? r.coinPerClickJam : r.coinPerClickMill}
                        vs={r.coinPerClickProduce}
                      />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.coinPerClickAlcohol} t={sc.coinPerClickAlcohol[i]}>
                      <Vs n={r.coinPerClickAlcohol} vs={r.coinPerClickProduce} />
                    </Td>
                    <Td highlight={highlight} row={r} path="alcohol" n={r.coinPerClickAlcoholAged} t={sc.coinPerClickAlcoholAged[i]}>
                      <Vs n={r.coinPerClickAlcoholAged} vs={r.coinPerClickProduce} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Table title="Derived stats">
              <thead>
                <tr>
                  <th className={`${th} ${sticky}`}>Crop</th>
                  <th className={th}>Growth days</th>
                  <th className={th}>Fruit days</th>
                  <th className={th}>Water consumed (L)</th>
                  <th className={th}>Pours</th>
                  <th className={th}>Freshness days</th>
                  <th className={th}>Fertilizer used (L)</th>
                  <th className={th}>Fertilizer money</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={`${r.id}:${r.variety}:der`} className="border-t border-ink/10">
                    <td className={`${td} ${sticky}`}>
                      <CropName row={r} />
                    </td>
                    <td className={td}>
                      <Calc n={r.growDays} />
                    </td>
                    <td className={td}>
                      <Calc n={r.fruitDays} />
                    </td>
                    <td className={td}>
                      <Calc n={r.totalWater} d={4} />
                    </td>
                    <td className={td}>
                      <Calc n={r.pours} />
                    </td>
                    <td className={td}>
                      <Calc n={r.rotDays} />
                    </td>
                    <td className={td}>
                      <Calc n={r.fertL} d={4} />
                    </td>
                    <td className={td}>
                      <span className="font-mono tabular-nums">
                        {fmt(r.fertCost, 3)}
                        {r.saleBase > 0 ? ` (${fmt((r.fertCost / r.saleBase) * 100, 1)}%)` : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </main>
        </div>
      </Chrome>
    </div>
  )
}

function CropName({ row }: { row: Row }) {
  if (row.variety === 'base') {
    return <span className="font-semibold">{CROP_NAME[row.id]()}</span>
  }
  return (
    <span className="flex items-center gap-1 pl-4 text-ink/75">
      <span className="text-ink/35">└</span>
      {cropVariety(row.id, row.variety)}
    </span>
  )
}

function Table({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="font-display text-sm">{title}</div>
      <div className="overflow-x-auto select-text">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    </section>
  )
}
