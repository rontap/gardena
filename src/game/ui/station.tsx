import { useEffect, useState } from 'react'
import { m } from '../../paraglide/messages.js'
import { CROP_NAME, cropVariety } from '../defs/crops.ts'
import { stationSeconds } from '../defs/items.ts'
import {
  ALMANAC_AT,
  almanacEntries,
  FAMILIARITY_RECOVER,
  FAMILIARITY_SEED_QUALITY,
  FAMILIARITY_VAR_BONUS,
  familiarityMax,
  HEIRLOOM_AT,
  HEIRLOOM_PLACE_AT,
  HEIRLOOM_PURPOSE_AT,
  needsNeighbour,
  tierVariety,
  VARIANT_AT,
  VARIANT_PURPOSE_AT,
  VARIETIES,
  VARIETY,
  type AlmanacEntry,
  type Purpose,
  type VarietyId,
} from '../defs/varieties.ts'
import { SAT_STEP_FRUIT } from '../sim/feature-contracts/market.ts'
import type { Coord } from '../sim/building.ts'
import { GROWN_IDS, isTreeId, packSku, type GrownCrop } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { fruitInner, fruitVarietyInner, svgInner, UI_BTN_ALMANAC } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Bar } from './frame.tsx'
import { Shell } from './store.tsx'

function useTick(): void {
  const [, bump] = useState(0)
  useEffect(() => {
    let raf = 0
    const step = () => {
      bump(n => n + 1)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])
}

type TipKind =
  | 'variety'
  | 'seed'
  | 'recover'
  | 'almanac'
  | 'variant'
  | 'heirloom'
  | 'variantPurpose'
  | 'heirloomPlace'
  | 'heirloomPurpose'

type Tip = { kind: TipKind; n: number; crop: GrownCrop } | undefined

const ENTRY_LABEL: { readonly [K in AlmanacEntry]: () => string } = {
  grow: m.hud_station_entry_grow,
  water: m.hud_station_entry_water,
  fert: m.hud_station_entry_fert,
  fresh: m.hud_station_entry_fresh,
}

const PURPOSE_LABEL: { readonly [K in Purpose]: () => string } = {
  produce: m.names_purpose_produce,
  processed: m.names_purpose_processed,
  alcohol: m.names_purpose_alcohol,
}

function tipName(tip: { kind: TipKind; crop: GrownCrop }): string {
  if (tip.kind === 'variety') return m.hud_station_variety_name()
  if (tip.kind === 'seed') return m.hud_station_seed_name()
  if (tip.kind === 'recover') return m.hud_station_recover_name()
  if (tip.kind === 'almanac') return m.hud_station_almanac_name()
  if (tip.kind === 'heirloomPlace') return m.hud_station_place_name()
  const tier = tip.kind === 'variant' || tip.kind === 'variantPurpose' ? 'variant' : 'heirloom'
  const v = tierVariety(tip.crop, tier)
  return v === undefined ? '' : cropVariety(tip.crop, v)
}

function tipBody(tip: { kind: TipKind; n: number; crop: GrownCrop }): string {
  if (tip.kind === 'variety') return m.hud_station_variety_tip()
  if (tip.kind === 'seed') return m.hud_station_seed_tip()
  if (tip.kind === 'recover') {
    const fruit = Math.round(((tip.n * FAMILIARITY_RECOVER) / SAT_STEP_FRUIT) * 100) / 100
    return m.hud_station_recover_tip({ fruit })
  }
  if (tip.kind === 'almanac') {
    const entries = almanacEntries(tip.n)
    return m.hud_station_almanac_tip({
      n: entries.length,
      max: ALMANAC_AT.length,
      list: entries.map(e => ENTRY_LABEL[e]().toLowerCase()).join(', '),
    })
  }
  const tier = tip.kind === 'variant' || tip.kind === 'variantPurpose' ? 'variant' : 'heirloom'
  const v = tierVariety(tip.crop, tier)
  if (v === undefined) return ''
  const name = cropVariety(tip.crop, v)
  if (tip.kind === 'variant') return m.hud_station_variant_tip({ name })
  if (tip.kind === 'heirloom') return m.hud_station_heirloom_tip({ name })
  if (tip.kind === 'heirloomPlace') {
    return needsNeighbour(v) ? m.hud_station_place_tip({ name }) : m.hud_station_place_none_tip({ name })
  }
  return m.hud_station_purpose_tip({ name, purpose: PURPOSE_LABEL[VARIETY[v].purpose]() })
}

function shown(world: World, crop: GrownCrop): boolean {
  if (world.familiarity[crop] > 0) return true
  if (isTreeId(crop)) return true
  const pack = packSku(crop)
  return pack === undefined || world.skuShown(pack)
}

export function StationUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  useTick()
  const [tip, setTip] = useState<Tip>(undefined)
  const cell = world.cell(at)
  if (cell.kind !== 'station') return null
  const crops = GROWN_IDS.filter(crop => shown(world, crop))
  const studied = crops.filter(crop => world.familiarity[crop] > 0)
  const left = Math.ceil((1 - cell.progress) * stationSeconds(cell.crop === 'none' ? 0 : world.familiarity[cell.crop]))
  return (
    <Shell
      title={m.hud_station_title()}
      onClose={onClose}
      className="w-[46rem] min-w-[28rem] max-w-[92vw]"
      aside={tip === undefined ? undefined : <CalloutHover title={tipName(tip)} description={tipBody(tip)} />}
    >
      <div className="flex max-h-[76vh] min-h-[26rem] flex-col gap-3">
        {cell.crop !== 'none' && (
          <>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-base text-ink">{m.hud_station_now()}</span>
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">
                {cropVariety(cell.crop, cell.variety)}
              </span>
              <Bar value={cell.progress} color="bg-study" track="bg-ink/20" className="h-2 w-40 shrink-0" />
              <span className="w-14 shrink-0 text-right text-sm tabular-nums text-ink/55">
                {m.hud_station_left({ n: left })}
              </span>
            </div>
            <hr className="border-ink/15" />
          </>
        )}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {studied.map(crop => (
            <CropCard key={crop} crop={crop} n={world.familiarity[crop]} onTip={setTip} />
          ))}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 pt-1">
            {studied.length === 0 && (
              <p className="max-w-[34rem] text-center text-sm leading-relaxed text-ink/70">{m.hud_station_intro()}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {crops
                .filter(crop => world.familiarity[crop] === 0)
                .map(crop => (
                  <svg
                    key={crop}
                    className="h-7 w-7 opacity-25 grayscale"
                    viewBox="0 0 24 24"
                    dangerouslySetInnerHTML={{ __html: fruitInner(crop) }}
                  />
                ))}
            </div>
          </div>
        </div>
        <hr className="border-ink/15" />
        <div className="text-sm text-ink/55">{m.hud_station_empty()}</div>
      </div>
    </Shell>
  )
}

function CropCard({ crop, n, onTip }: { crop: GrownCrop; n: number; onTip: (t: Tip) => void }) {
  const max = familiarityMax(crop)
  const pct = (x: number) => Math.round(x * 1000) / 10
  const chips = [...gains(crop, n, pct), ...unlocks(crop, n)]
  const done = n >= max
  return (
    <div className="flex flex-col gap-2 bg-ink/6 px-3 py-2">
      <div className="flex items-center gap-2">
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: fruitInner(crop) }} />
        {found(crop, n).map(t => (
          <svg
            key={t.kind}
            onPointerEnter={() => onTip({ kind: t.kind, n, crop })}
            onPointerLeave={() => onTip(undefined)}
            className="h-6 w-6 shrink-0"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: fruitVarietyInner(crop, t.variety) }}
          />
        ))}
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{CROP_NAME[crop]()}</span>
        <span className={`shrink-0 text-sm ${done ? 'text-study' : 'text-ink/55'}`}>
          {done ? m.hud_station_done() : m.hud_station_row({ n, max })}
        </span>
      </div>
      {!done && <Bar value={n / max} color="bg-study" track="bg-ink/20" className="h-1.5" />}
      <div className="grid grid-cols-3 gap-1">
        {chips.map(chip => (
          <span
            key={chip.kind}
            onPointerEnter={() => onTip({ kind: chip.kind, n, crop })}
            onPointerLeave={() => onTip(undefined)}
            className={`flex min-w-0 items-center justify-center gap-1 px-2 py-0.5 text-xs ${TONE[chip.tone]}`}
          >
            {chip.icon !== undefined && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: chip.icon }} />
            )}
            <span className="truncate">{chip.text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function found(crop: GrownCrop, n: number): { kind: TipKind; variety: VarietyId }[] {
  const out: { kind: TipKind; variety: VarietyId }[] = []
  const variant = tierVariety(crop, 'variant')
  if (n >= VARIANT_AT && variant !== undefined) out.push({ kind: 'variant', variety: variant })
  const heirloom = tierVariety(crop, 'heirloom')
  if (n >= HEIRLOOM_AT && heirloom !== undefined) out.push({ kind: 'heirloom', variety: heirloom })
  return out
}

type Tone = 'study' | 'almanac' | 'variety'
type Chip = { kind: TipKind; icon?: string; text: string; tone: Tone }

const TONE: { readonly [K in Tone]: string } = {
  study: 'bg-study/15 text-ink/80',
  almanac: 'bg-dirt/20 text-dirt-dark',
  variety: 'bg-ripe/25 text-ink/80',
}

function unlocks(crop: GrownCrop, n: number): Chip[] {
  const out: Chip[] = []
  const entries = almanacEntries(n)
  if (entries.length > 0) {
    out.push({
      kind: 'almanac',
      tone: 'almanac',
      icon: svgInner(UI_BTN_ALMANAC),
      text: m.hud_station_almanac_chip({ n: entries.length }),
    })
  }
  const variant = tierVariety(crop, 'variant')
  if (variant !== undefined && n >= VARIANT_PURPOSE_AT) {
    out.push({
      kind: 'variantPurpose',
      tone: 'variety',
      icon: fruitVarietyInner(crop, variant),
      text: m.hud_station_best_for({ purpose: PURPOSE_LABEL[VARIETY[variant].purpose]() }),
    })
  }
  const heirloom = tierVariety(crop, 'heirloom')
  if (heirloom !== undefined && n >= HEIRLOOM_PLACE_AT) {
    out.push({
      kind: 'heirloomPlace',
      tone: 'variety',
      icon: fruitVarietyInner(crop, heirloom),
      text: needsNeighbour(heirloom) ? m.hud_station_place_chip() : m.hud_station_place_free_chip(),
    })
  }
  if (heirloom !== undefined && n >= HEIRLOOM_PURPOSE_AT) {
    out.push({
      kind: 'heirloomPurpose',
      tone: 'variety',
      icon: fruitVarietyInner(crop, heirloom),
      text: m.hud_station_best_for({ purpose: PURPOSE_LABEL[VARIETY[heirloom].purpose]() }),
    })
  }
  return out
}

function gains(crop: GrownCrop, n: number, pct: (x: number) => number): Chip[] {
  const out: Chip[] = []
  if (VARIETIES[crop].length > 1) {
    out.push({ kind: 'variety', tone: 'study', text: m.hud_station_variety({ n: pct(n * FAMILIARITY_VAR_BONUS) }) })
  }
  out.push({ kind: 'seed', tone: 'study', text: m.hud_station_seed({ n: pct(n * FAMILIARITY_SEED_QUALITY) }) })
  out.push({ kind: 'recover', tone: 'study', text: m.hud_station_recover({ n: pct(n * FAMILIARITY_RECOVER) }) })
  return out
}
