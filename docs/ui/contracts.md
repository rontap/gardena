# Contracts

Tab on [[ui/market]]. Panel stays `{ kind: 'market' }`. Hidden iff `!world.done.has('unlock-contracts')`. [[mechanics/contracts]].

`slots = CONTRACT_OFFERS +` (broker ≥ 1 ? 1 : 0). Cap `CONTRACT_ACTIVE +` (broker ≥ 2 ? 1 : 0). Board `rollBoard(world.rng, world.clock.day, slots, world.contracts.repDay)`. Drop ids in `takenToday`. Regenerating is free. Panel does not re-roll mix / amount / fee lerp; remaining days and live cancel fee are display.

Host and guest: Accept / Cancel / Reorder. [[mechanics/multiplayer]] `mp.guest` [[ui/multiplayer]]

`#debug-contracts` — generator ladder, not the overlay. [[ui/cheat]]

## Split

`Tabs.Content` `contracts`: two columns. Left: today's board. No scroll. Overlay still no-scroll — [[ui/market]]. Board stays 2-col × 3/4-row. Broker 0: 6 cards. T1+: 7 cards. Not 8. Slot 7 unused. Empty cells stay empty. Type [[ui/type]].

Right: accepted stack, history below. Empty iff `active.length === 0` and `history.length === 0`: **No contracts running.** Right may scroll so the board does not.

## Offer card

The card is the Accept control. Not a nested label. Host click `acceptContract { c: offer.id }`.

| who | fill | click |
|---|---|---|
| not at cap | hover fill, pointer | `acceptContract` |
| at cap | no hover fill, `aria-disabled` guarded click | no-op |

Not the `disabled` attribute. Taken today: card gone, not grey.

Row 1: company face `company-{id}.svg` left of `COMPANIES[offer.company].name`, `Difficulty` on the right. Amount row: `demandFace` then `demandName`. Pair: two rows. Count lives on the `Item`, not a `×` glyph. Duration row is duration only: `offer.days === 1` → **1 day**. Else `{offer.days} days`. Prize / cash own line. Cash: `<Coin n={offer.reward} />`. Prize: `PrizeChip` always icon + full `prizeName`.

### Hover

[[ui/callout-hover]] on Market Overlay `aside`. Title `COMPANIES[offer.company].name`. Hover including at-cap. Prize-only hover replaces a cash explanation. Body slots: `{difficulty}/40 difficulty contract for {company}`; one **Deliver** line per demand; duration and reward (cash includes `{pct}% more than farmer's market`; prize has no that clause); **Cancellation cost is {fee}**; **Click to accept offer** on board, not at cap. At-cap why: cap 3 **Three contracts already running.**; broker T2 **Four contracts already running.**

`item` = `demandName`. The board does not ask for a variety or a quality floor. [[mechanics/contracts]]

### Company

Name is `COMPANIES[offer.company].name`. Complete book — all six `CompanyId`. Art `company-{id}.svg` for six.

### Line face

Count / liters is on the `Item`. Sugar and extract are never demanded. Faces carry no mark — the Variety group is the face. Board does not ask for a variety: every demand face is `'base'` quality 0.

| demand | face |
|---|---|
| plain crop | fruit `ItemFace`, `'base'`, `count`. Sugar-cane is cane fruit |
| plain wine / cider | that cask `ItemFace`, `'base'`, `count` |
| plain spirit | that spirit `ItemFace`, `'base'`, `count` |
| plain oil / flour | that `ItemFace` |
| plain jam | jam `ItemFace`, `'base'` |
| group jam | `AnyJamFace`: cycles `JAM_CROPS` every `CYCLE_MS`, `ItemFace` jam `'base'`, `count` |
| group spirit | vodka spirit `ItemFace`, `'base'`, `count` |

`demandName`: group jam **Any jam**, group spirit **Any spirit**, else `stallName`.

### Stars

`Difficulty`: `stars` many dots, all `TIER_DOT[stars]`. `aria-label="Difficulty {n}"`. Same on board, active, history, recap.

## Accepted

`world.contracts.active` array order — that is fill order. Remaining per line: `amount - filled`. `{x.x} days left` own line — one decimal, `dueDay - nowDay`. Reward own line. Then `Bar` `value={filled / need}`. Reorder: ▲ `reorderContract { c, d: -1 }`, ▼ `{ c, d: 1 }`. Ends: still shown, sim no-op.

×. Click arms. Armed click `cancelContract { c }`. Not a new dialog. Hover (armed or not): Overlay aside. Title the company name. Body **Cancelling this offer will incur a {Coin fee} penalty.** `{fee}` = `cancelFee(active, nowDay)`.

## History

Below the stack. One line each, `history` array order, at most `CONTRACT_HISTORY_MAX`. Company name, `Difficulty`, `e.day`, outcome, amount `Coin`.

| `outcome.kind` | outcome | amount |
|---|---|---|
| `done` | Completed | `paid` |
| `missed` | Missed | `penalty` |
| `cancelled` | Cancelled | `fee` |

Between the outcome and the amount, `RepChange` prints the stored `HistoryEntry.rep` as **{sign}{n} Reputation**. `rep === 0` prints nothing. Same component on the Recap line — [[ui/docks]] [[mechanics/contracts]] `contracts.rep-line`.

## Recap

Seam dialog [[ui/docks]]. When `unlock-contracts` done: that day's `Recap.contracts` as history lines and **A new board is up.** Omit the block when not unlocked.
