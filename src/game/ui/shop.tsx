import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { BUILD_SHELVES, SHELVES, SHOP_SHELVES, shelfOf, type Shelf, type ShelfId } from '../defs/shelf.ts'
import type { SkuId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { Dock, SearchField, tabRailClass, tabRailListClass } from './frame.tsx'
import { locked, matches, SkuCallout, SkuCard } from './sku-card.tsx'

type Deck = {
  panel: 'shop' | 'build'
  title: () => string
  shelves: readonly Shelf[]
  hint: () => string
}

const WIDTH = 'w-[28rem]'

const SHOP: Deck = {
  panel: 'shop',
  title: () => m.hud_general_store(),
  shelves: SHOP_SHELVES,
  hint: () => m.hud_shop_hint(),
}

const BUILD: Deck = {
  panel: 'build',
  title: () => m.hud_build(),
  shelves: BUILD_SHELVES,
  hint: () => m.hud_build_hint(),
}

export function Shop(props: DeckProps) {
  return <SkuDock deck={SHOP} {...props} />
}

export function Build(props: DeckProps) {
  return <SkuDock deck={BUILD} {...props} />
}

type DeckProps = {
  world: World
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  onGo: (panel: 'shop' | 'build') => void
  onShelf: (id: ShelfId) => void
}

function SkuDock({ deck, world, onClose, query, setQuery, onGo, onShelf }: DeckProps & { deck: Deck }) {
  const [hot, setHot] = useState<SkuId | undefined>(undefined)
  const open = deck.shelves.filter(s => shown(world, s).length > 0)
  const [tab, setTab] = useState<ShelfId | undefined>(undefined)
  const at = tab !== undefined && open.some(s => s.id === tab) ? tab : open[0]?.id
  const hits = query.trim() === '' ? undefined : found(world, query)

  function act(id: SkuId): void {
    const home = shelfOf(id).panel
    world.buy(id)
    if (home !== deck.panel) onGo(home)
  }

  return (
    <Dock
      width={WIDTH}
      title={deck.title()}
      onClose={onClose}
      aside={hot !== undefined ? <SkuCallout world={world} id={hot} /> : undefined}
      footer={<div className="text-sm text-ink/55">{footer(deck, at, hits)}</div>}
    >
      <div className="mb-2">
        <SearchField value={query} onChange={setQuery} placeholder={deck.hint()} />
      </div>
      {at === undefined ? (
        <div className="py-4 text-sm text-ink/50">{m.hud_nothing_here()}</div>
      ) : (
        <Tabs.Root
          value={hits === undefined ? at : ''}
          orientation="vertical"
          className="flex gap-2"
          onValueChange={v => {
            const id = v as ShelfId
            setTab(id)
            setQuery('')
            setHot(undefined)
            onShelf(id)
          }}
        >
          <Tabs.List className={tabRailListClass}>
            {open.map(s => (
              <Tabs.Trigger key={s.id} value={s.id} className={tabRailClass}>
                {s.label()}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {hits !== undefined ? (
            <div className="min-w-0 flex-1">
              <Grid>
                {hits.map(id => (
                  <SkuCard key={id} id={id} world={world} onHot={setHot} onAct={act} />
                ))}
              </Grid>
            </div>
          ) : (
            open.map(s => (
              <Tabs.Content key={s.id} value={s.id} className="min-w-0 flex-1">
                <Grid>
                  {s.groups.flatMap(g => sorted(world, g.skus)).map(id => (
                    <SkuCard key={id} id={id} world={world} onHot={setHot} onAct={act} />
                  ))}
                </Grid>
              </Tabs.Content>
            ))
          )}
        </Tabs.Root>
      )}
    </Dock>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid auto-rows-[6.75rem] grid-cols-3 gap-1">{children}</div>
}

function shown(world: World, shelf: Shelf): SkuId[] {
  return shelf.groups.flatMap(g => g.skus).filter(id => world.skuShown(id))
}

function sorted(world: World, skus: SkuId[]): SkuId[] {
  return skus.filter(id => world.skuShown(id)).sort((a, b) => Number(locked(world, a)) - Number(locked(world, b)))
}

function found(world: World, query: string): SkuId[] {
  const all = SHELVES.flatMap(s => s.groups.flatMap(g => g.skus))
  return all.filter(id => world.skuShown(id) && matches(id, query))
}

function footer(deck: Deck, at: ShelfId | undefined, hits: SkuId[] | undefined): string {
  if (hits !== undefined) return hits.length === 0 ? m.hud_nothing_matches() : m.hud_found({ n: hits.length })
  const shelf = deck.shelves.find(s => s.id === at)
  return shelf === undefined ? m.hud_research_opens() : shelf.line()
}
