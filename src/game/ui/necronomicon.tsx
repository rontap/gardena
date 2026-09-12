import { m } from '../../paraglide/messages.js'
import { CROP_NAME } from '../defs/crops.ts'
import { EARLY_FRUIT, NECRO_GOLD, PAGES, SUPPER } from '../defs/necronomicon.ts'
import type { Coord } from '../sim/building.ts'
import { pagesHidden, pageStates, ritualReady } from '../sim/feature-necronomicon/necronomicon.ts'
import type { PageState } from '../sim/feature-necronomicon/necronomicon.h.ts'
import type { GrownCrop, SupperId } from '../sim/ids.ts'
import type { Item } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { fruitInner, itemInner } from '../view/svgs.ts'
import { Bar } from './frame.tsx'
import { Shell } from './store.tsx'

export function NecronomiconUi({
  world,
  at,
  onClose,
}: {
  world: World
  at: Coord
  onClose: () => void
}) {
  const book = world.cell(at)
  if (book.kind !== 'necronomicon') return null
  const pages = pageStates(world, book)
  const twilight = world.clock.phase() === 'twilight'
  const ready = ritualReady(world, book)
  const reason = !twilight
    ? m.necro_ritual_wait()
    : !ready
      ? m.necro_ritual_nothing()
      : ''
  return (
    <Shell title={m.necro_title()} onClose={onClose} className="w-[34rem]">
      <div className="flex flex-col gap-3">
        <div className="text-sm leading-relaxed text-ink/70">{m.necro_intro()}</div>
        <div className="flex flex-col gap-2">
          {pages.map(p => (
            <PageRow key={p.id} page={p} book={{ fruit: book.fruit, supper: book.supper }} />
          ))}
        </div>
        {pagesHidden(world, book) && <div className="text-sm text-ink/55">{m.necro_more()}</div>}
        <GoldRow world={world} have={book.gold} open={pages.some(p => p.id === 'gold')} done={book.done.includes('gold')} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={reason !== ''}
            onClick={() => world.performRitual()}
            className="h-9 flex-1 bg-grape text-sm font-semibold text-house disabled:bg-ink/10 disabled:text-ink/40"
          >
            {m.necro_ritual()}
          </button>
        </div>
        {reason !== '' && <div className="text-sm text-ink/55">{reason}</div>}
      </div>
      <div className="mt-3 text-sm text-ink/55">{m.necro_footer()}</div>
    </Shell>
  )
}

function PageRow({
  page,
  book,
}: {
  page: PageState
  book: { fruit: readonly GrownCrop[]; supper: readonly SupperId[] }
}) {
  const name =
    page.id === 'crop' && page.crop !== 'none'
      ? m.necro_page_crop_name_locked({ crop: CROP_NAME[page.crop]() })
      : PAGES[page.id].name
  return (
    <div className={`flex flex-col gap-1 bg-ink/6 px-3 py-2 ${page.done ? 'opacity-55' : ''}`}>
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{name}</span>
        <span className="shrink-0 text-sm text-ink/55">
          {page.done ? m.necro_page_done() : m.necro_progress({ have: page.have, want: page.want })}
        </span>
      </div>
      <div className="text-sm leading-relaxed text-ink/70">{PAGES[page.id].blurb}</div>
      {page.id === 'early-fruit' ? (
        <FruitRow given={book.fruit} />
      ) : page.id === 'supper' ? (
        <SupperRow given={book.supper} />
      ) : (
        <Bar value={page.have / page.want} color="bg-grape" track="bg-ink/20" className="h-1.5" />
      )}
    </div>
  )
}

function FruitRow({ given }: { given: readonly GrownCrop[] }) {
  return (
    <div className="flex items-center gap-1">
      {EARLY_FRUIT.map(crop => (
        <svg
          key={crop}
          className={`h-6 w-6 ${given.includes(crop) ? '' : 'opacity-25 grayscale'}`}
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: fruitInner(crop) }}
        />
      ))}
    </div>
  )
}

const SUPPER_FACE: { readonly [K in SupperId]: Item } = {
  palinka: { kind: 'spirit', spirit: 'brandy', variety: 'klosterneuburger', quality: 0, count: 1, unitSale: 0, infused: false },
  wine: { kind: 'cask', cask: 'wine', variety: 'keknyelu', quality: 0, count: 1, unitSale: 0, infused: false },
  bread: { kind: 'bread', quality: 0, count: 1, unitSale: 0 },
}

function SupperRow({ given }: { given: readonly SupperId[] }) {
  return (
    <div className="flex items-center gap-1">
      {SUPPER.map(good => (
        <svg
          key={good}
          className={`h-6 w-6 ${given.includes(good) ? '' : 'opacity-25 grayscale'}`}
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: itemInner(SUPPER_FACE[good]) }}
        />
      ))}
    </div>
  )
}

function GoldRow({
  world,
  have,
  open,
  done,
}: {
  world: World
  have: number
  open: boolean
  done: boolean
}) {
  if (!open || done || have >= NECRO_GOLD) return null
  const short = world.money < NECRO_GOLD
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={short}
        onClick={() => world.sacrificeGold()}
        className="flex h-9 items-center justify-center gap-2 bg-dirt text-sm font-semibold text-house disabled:bg-ink/10 disabled:text-ink/40"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner({ kind: 'treasure', coins: NECRO_GOLD }) }} />
        {m.necro_gold_pay({ amount: NECRO_GOLD })}
      </button>
      {short && <div className="text-sm text-ink/55">{m.necro_gold_short()}</div>}
    </div>
  )
}
