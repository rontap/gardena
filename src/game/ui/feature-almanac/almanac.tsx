import { Fragment, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { m } from '../../../paraglide/messages.js'
import { catalogEntries, type CatalogEntry } from '../../defs/catalog.ts'
import { TREE_YIELD_DAYS } from '../../defs/trees.ts'
import type { World } from '../../sim/world.ts'
import { itemInner, UI_ARROW_FILL, UI_ARROW_INK } from '../../view/svgs.ts'
import { CalloutHover } from '../callout-hover.tsx'
import { Label, Overlay, tabTriggerClass } from '../frame.tsx'
import { Recipes } from '../recipe.tsx'
import { ConceptPane } from './concepts.tsx'
import { AlmanacGo, AlmanacLink, AlmanacTip, firstId, LISTS, Rich, rowId, rowsOf, rowTitle, skuEntry, tabOf, TABS, trailBack, trailForward, trailPush, trailStart, type AlmanacNav, type AlmanacTab, type ListRow, type Tip, type Trail } from './nav.tsx'
import { FormCards, Pane } from './panes.tsx'
import { RecipeSale, ToolPane } from './stats.tsx'

export { CONCEPT_IDS, linksResolve } from './nav.tsx'

export const WATER_OVERVIEW = [m.almanac_water_p1, m.almanac_water_p2, m.almanac_water_p3, m.almanac_water_p4] as const

function NavArrow({ back, disabled, onClick }: { back: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={back ? '←' : '→'}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-sm p-2.5 hover:bg-dirt disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <span className={`relative block h-6 w-12 ${back ? 'rotate-180' : ''}`}>
        <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full" dangerouslySetInnerHTML={{ __html: UI_ARROW_INK }} />
        <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full" dangerouslySetInnerHTML={{ __html: UI_ARROW_FILL }} />
      </span>
    </button>
  )
}

export function Almanac({ world, onClose }: { world: World; onClose: () => void }) {
  const entries = catalogEntries(world.pace)
  const [trail, setTrail] = useState<Trail>(() => trailStart({ tab: 'fruits', id: firstId('fruits') }))
  const [tip, setTip] = useState<Tip>(undefined)
  const here = trail.stack[trail.at]
  const tab = here.tab
  const id = here.id
  const byId = new Map(entries.map(e => [e.id, e]))
  const rows = rowsOf(tab)
  const row = rows.find(r => rowId(r) === id)
  if (row === undefined) throw new Error('AlmanacNav')
  const go = (to: AlmanacNav) => {
    setTrail(cur => trailPush(cur, to))
    setTip(undefined)
  }
  const step = (move: (cur: Trail) => Trail) => {
    setTrail(move)
    setTip(undefined)
  }
  return (
    <Overlay
      title={
        <span className="inline-flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <NavArrow back disabled={trail.at === 0} onClick={() => step(trailBack)} />
            <NavArrow back={false} disabled={trail.at === trail.stack.length - 1} onClick={() => step(trailForward)} />
          </span>
          <span>{m.hud_almanac()}</span>
        </span>
      }
      onClose={onClose}
      className="h-[min(48rem,calc(100vh-6rem))] w-[48rem]"
      aside={
        tip !== undefined ? (
          <CalloutHover
            title={tip.title}
            description={tip.recipes.map((recipe, i) => (
              <Fragment key={i}>
                <RecipeSale recipe={recipe} />
                <Recipes view={{ kind: 'one', recipe }} size="sm" world={world} />
              </Fragment>
            ))}
          />
        ) : undefined
      }
    >
      <AlmanacGo.Provider value={go}>
        <AlmanacTip.Provider value={setTip}>
        <Tabs.Root
          value={tab}
          onValueChange={v => go({ tab: tabOf(v), id: firstId(tabOf(v)) })}
          className="relative z-20 flex min-h-0 flex-1 flex-col"
        >
          <Tabs.List className="sticky top-0 z-10 flex shrink-0 flex-wrap gap-1 border-b border-ink/20 bg-house px-4">
            {TABS.map(t => (
              <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
                {t.label()}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="relative z-20 flex min-h-0 flex-1 mx-[-0.75rem]">
            <div className="scroll-pane w-44 shrink-0 min-h-0 overflow-y-auto border-r border-ink/20">
              {LISTS[tab].map(r => {
                if (r.kind === 'heading') {
                  return (
                    <div key={r.label()} className="px-2 pt-2">
                      <Label>{r.label()}</Label>
                    </div>
                  )
                }
                const rid = rowId(r)
                return (
                  <button
                    key={rid}
                    type="button"
                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-lg ${
                      rid === id ? 'bg-dirt text-house' : 'text-ink hover:bg-dirt/30'
                    }`}
                    onClick={() => go({ tab, id: rid })}
                  >
                    {r.kind === 'sku' || r.kind === 'forms' || r.kind === 'tools' ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        dangerouslySetInnerHTML={{ __html: itemInner(skuEntry(byId, r.id).icon) }}
                      />
                    ) : null}
                    <span className="truncate">{rowTitle(r, byId)}</span>
                  </button>
                )
              })}
            </div>
            <div className="scroll-pane min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
              <RowPane
                row={row}
                byId={byId}
                world={world}
                done={{
                  fermentation: world.done.has('unlock-fermentation'),
                  grinder: world.done.has('unlock-grinder'),
                  preservatives: world.done.has('unlock-preservatives'),
                  furnace: world.done.has('unlock-furnace'),
                  infusion: world.done.has('unlock-infusion'),
                }}
                familiarity={world.familiarity}
                tab={tab}
              />
            </div>
          </div>
        </Tabs.Root>
        </AlmanacTip.Provider>
      </AlmanacGo.Provider>
    </Overlay>
  )
}

export type AlmanacDone = { fermentation: boolean; grinder: boolean; preservatives: boolean; furnace: boolean; infusion: boolean }

function RowPane({
  row,
  byId,
  world,
  done,
  familiarity,
  tab,
}: {
  row: ListRow
  byId: Map<string, CatalogEntry>
  world: World
  done: AlmanacDone
  familiarity: World['familiarity']
  tab: AlmanacTab
}) {
  switch (row.kind) {
    case 'overview':
      return <OverviewPane tab={tab} />
    case 'concept':
      return <ConceptPane id={row.id} rules={world.rules} />
    case 'sku':
      return <Pane entry={skuEntry(byId, row.id)} done={done} familiarity={familiarity} tab={tab} world={world} />
    case 'forms':
      return <FormCards title={row.title()} entries={row.ids.map(id => skuEntry(byId, id))} />
    case 'tools':
      return <ToolPane title={row.title()} family={row.family} byId={byId} world={world} />
  }
}

function OverviewPane({ tab }: { tab: AlmanacTab }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{m.almanac_overview()}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{overviewBody(tab)}</div>
    </>
  )
}

function overviewBody(tab: AlmanacTab) {
  switch (tab) {
    case 'fruits':
      return <FruitsOverview />
    case 'sensors':
      return <SensorsOverview />
    case 'machines':
      return <MachinesOverview />
    case 'vehicles':
      return <VehiclesOverview />
    case 'water':
      return <WaterOverview />
    case 'utility':
    case 'concepts':
    case 'misc':
      throw new Error(tab)
  }
}

function FruitsOverview() {
  return (
    <>
      <div>
        {m.almanac_seeds_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_seeds_p1_b()}
      </div>
      <div>
        {m.almanac_seeds_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_seeds_p2_b()}
      </div>
      <div>
        {m.almanac_seeds_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_seeds_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_seeds_p3_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_seeds_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_seeds_p3_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_seeds_p3_f()}
      </div>
      <div>{m.almanac_tree_seasons({ days: TREE_YIELD_DAYS })}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function SensorsOverview() {
  return (
    <>
      <div>{m.almanac_sensors_p1()}</div>
      <div>
        {m.almanac_sensors_p2_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'lever' }}>{m.names_sensor_lever()}</AlmanacLink>
        {m.almanac_sensors_p2_b()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_sensors_p3_a()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function MachinesOverview() {
  return (
    <>
      <div>
        {m.almanac_auto_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_p1_b()}
      </div>
      <div>
        {m.almanac_auto_p2_a()}
        <AlmanacLink to={{ tab: 'machines', id: 'mill' }}>{m.names_building_mill()}</AlmanacLink>
        {m.almanac_auto_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_p2_c()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_auto_p3_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_overview_link()}</AlmanacLink>
        {m.almanac_auto_p3_b()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_overview_link()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function VehiclesOverview() {
  return (
    <>
      <div>{m.almanac_vehicles_p1()}</div>
      <div>
        {m.almanac_vehicles_p2_a()}
        <AlmanacLink to={{ tab: 'vehicles', id: 'hangar' }}>{m.names_building_hangar()}</AlmanacLink>
        {m.almanac_vehicles_p2_b()}
      </div>
      <div>
        {m.almanac_vehicles_p3_a()}
        <AlmanacLink to={{ tab: 'vehicles', id: 'refuel' }}>{m.names_building_refuel()}</AlmanacLink>
        {m.almanac_vehicles_p3_b()}
      </div>
      <div>
        {m.almanac_vehicles_p4_a()}
        <AlmanacLink to={{ tab: 'vehicles', id: 'dispatch' }}>{m.names_sensor_dispatch()}</AlmanacLink>
        {m.almanac_vehicles_p4_b()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'vehicles', id: 'hangar' }}>{m.names_building_hangar()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'vehicles', id: 'refuel' }}>{m.names_building_refuel()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_overview_link()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function WaterOverview() {
  return (
    <>
      {WATER_OVERVIEW.map(p => (
        <div key={p()}>
          <Rich text={p()} />
        </div>
      ))}
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'water', id: 'pumpjack' }}>{m.names_building_pump()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'water', id: 'well' }}>{m.names_building_well()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'water', id: 'tap' }}>{m.names_building_tap()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'water', id: 'pipe' }}>{m.names_building_pipe()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'water', id: 'valve' }}>{m.names_building_valve()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'water', id: 'sprinkler' }}>{m.names_building_sprinkler()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

