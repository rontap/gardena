# Contracts

Tab on [[ui/market]]. Panel stays `{ kind: 'market' }`. Hidden iff `!world.done.has('unlock-contracts')`. [[mechanics/contracts]].

`slots = CONTRACT_OFFERS +` (broker ≥ 1 ? 1 : 0). Cap `CONTRACT_ACTIVE +` (broker ≥ 2 ? 1 : 0). Board `rollBoard(world.rng, world.clock.day, slots, world.contracts.repDay)`. Drop ids in `takenToday` — those cards are gone. Regenerating is free. Panel does not re-roll mix / amount / fee lerp; remaining days and live cancel fee are display (`nowDay` as mechanics, `cancelFee(active, nowDay)`).

Host: Accept / Cancel / Reorder. Guest: board and fill progress; those controls omitted. Guest cmds never fire. [[ui/multiplayer]]

`#debug-contracts` — generator ladder, not the overlay. [[ui/cheat]]

## Split

`Tabs.Content` `contracts`: `grid grid-cols-2 min-h-0 flex-1`. Split down the middle.

Left: today's board. `overflow-hidden`. No `scroll-pane`. No `overflow-y-auto`. Overlay still no-scroll — [[ui/market]] `w-[72rem]`. Board stays 2-col × 3/4-row.

| broker | grid | cards |
|---|---|---|
| 0 | `grid grid-cols-2 grid-rows-3 gap-2` | 6 |
| T1+ | `grid grid-cols-2 grid-rows-4 gap-2` | 7 |

Not 8. Slot 7 unused. Empty cells stay empty. Type [[ui/type]].

Right: `flex min-h-0 flex-col`. Left pane `border-r border-ink/20`.

Empty iff `active.length === 0` and `history.length === 0`: **No contracts running.** `flex items-center justify-center text-sm text-ink/50`. Else accepted stack, history below. Right may `min-h-0 overflow-y-auto scroll-pane` so the board does not scroll.

## Offer card

The card is the Accept control. Not a nested label. Frame `bg-ink/6 px-3 py-2 flex flex-col gap-1`. Host click `acceptContract { c: offer.id }`.

| who | fill | click |
|---|---|---|
| host, not at cap | `hover:bg-ink/12 active:bg-ink/20` `cursor-pointer` | `acceptContract` |
| host, at cap | no hover fill. `text-ink/35` `aria-disabled` guarded `onClick` | no-op |
| guest | no hover fill. Not the Accept control | never |

Not the `disabled` attribute. Taken today: card gone, not grey.

```
[ face name                      Difficulty ]
[ ItemFace (count)  demandName              ]
[ ItemFace (count)  demandName              ]   ← pair only
[ 1 day | N days                            ]
[ Coin | PrizeChip                          ]
```

Row 1: `flex items-center justify-between gap-2`. Company `flex items-center gap-2`: face `company-{id}.svg` `h-6 w-6 shrink-0` (24×24, `viewBox="0 0 24 24"`) left of `COMPANIES[offer.company].name` `text-sm font-semibold`. `Difficulty` on the right.

Amount row: `flex items-center gap-2 text-base font-semibold`. `demandFace(demand, count)` then `demandName` `truncate`. Pair: two rows. No markup on the card. Count lives on the `Item`, not a `×` glyph.

Duration row is duration only: `text-sm`. `offer.days === 1` → **1 day**. Else `{offer.days} days`.

Prize / cash **own line**, no truncate. Cash: `<Coin n={offer.reward} />`. Prize: `PrizeChip` always icon + full `prizeName`. Drop `truncate` on the name.

### Hover

[[ui/callout-hover]] on Market Overlay `aside`. Title `COMPANIES[offer.company].name`. Hover on guest and host, including at-cap. Prize-only hover **replaces** the old “Pays … instead of money / No cash” card.

`item` = `demandName`. The board does not ask for a variety or a quality floor. [[mechanics/contracts]]

Body, `whitespace-pre-line` fragment:

```
{difficulty}/40 difficulty contract for {company}.
Deliver {amount} {item}.
[Deliver …]  ← pair only
Contract duration is {n} day(s), earn {reward} when completed[{monetary}].
Cancellation cost is {fee}.
[Click to accept offer]
```

- `{difficulty}` = `offer.difficulty`. `{company}` = `COMPANIES[offer.company].name`.
- One **Deliver** line per demand. `{item}` = `demandName(demand)`.
- Duration: `1 day` / `{n} days` (`n === 1` vs else). Same as the card.
- Cash: `{reward}` is `<Coin n={offer.reward} />`. `{monetary}` is ` ({pct}% more than farmer's market)` with `pct = Math.round(offer.markup * 100)`.
- Prize: `{reward}` is `prizeName(offer.prize)`. No `{monetary}`.
- Board `{fee}` = `<Coin n={offer.penalty} />`.
- **Click to accept offer**: board, host, not at cap.
- At-cap why, `mt-2 block font-bold text-roof` (existing):
  - cap 3: **Three contracts already running.**
  - broker T2 (cap 4): **Four contracts already running.**
- Guest: no CTA. No at-cap why.

### Company

Name is `COMPANIES[offer.company].name`. Complete book — all six `CompanyId`: `whole-cart` `trade-jo` `halbert-eijn` `little-lid` `mercanova` `intercrop`. Art `company-{id}.svg` for six. Lookup does not special-case a stub three.

### Line face

Count / liters is on the `Item` (`demandItem(demand, count)`). Sugar and extract are never demanded.

A `Demand` is `plain` or group. Faces carry no mark — the Variety group is the face. Board does not ask for a variety: every demand face is `'base'`.

| demand | face |
|---|---|
| plain crop | fruit `ItemFace`, `'base'`, `count`. Sugar-cane is cane fruit. |
| plain wine / cider | that cask `ItemFace`, `'base'`, `count` |
| plain spirit | that spirit `ItemFace`, `'base'`, `count` |
| plain oil / flour | that `ItemFace` |
| plain jam | jam `ItemFace` (`JamId` crop; tomato ketchup), `'base'` |
| group jam | `AnyJamFace`: cycles `JAM_CROPS` every 800ms, `ItemFace` jam `'base'`, `count` |
| group spirit | vodka spirit `ItemFace`, `'base'`, `count` |

`demandName`: group jam **Any jam**, group spirit **Any spirit**, else `stallName`.

### Stars

`Difficulty`: `stars` many `h-2 w-2 rounded-full`, all `TIER_DOT[stars]` (`bg-tier-1`…`bg-tier-4`). `aria-label="Difficulty {n}"`. Same on board, active, history, recap.

## Accepted

`world.contracts.active` array order — that is fill order. Same card frame `relative bg-ink/6 px-3 py-2 flex flex-col gap-1`. Stacked `flex flex-col gap-2`.

```
[ face name                      Difficulty ] [▲]
[ ItemFace (remaining)  demandName          ] [▼]
[ ItemFace (remaining)  demandName          ]
[ {x.x} days left                           ]
[ Coin | PrizeChip                          ]
[ Bar                                       ]
```

Header `pr-6` so ▲▼ clear the ×. Remaining per line: `amount - filled`. Same `AmountRow` as the offer. `{x.x} days left` own line — one decimal, `tabular-nums`, `dueDay - nowDay`. Reward own line: cash `<Coin n={offer.reward} />`, else `PrizeChip`. Then `Bar` `value={filled / need}` `color="bg-leaf"` `track="bg-ink/25"`. `need` / `filled` = sums of line amounts / `bin.filled`.

Reorder host only: ▲ `reorderContract { c, d: -1 }`, ▼ `{ c, d: 1 }`. `d = 1` toward the end. Ends: still shown, sim no-op. No extra disabled face.

### Cancel

Host ×. Guest: omitted. Drop the full-width Cancel `Btn`.

`absolute top-1 right-1` `text-lg` `text-ink/60 hover:bg-dirt hover:text-house` `aria-label="Cancel"`. Armed: Btn selected face `bg-ink text-house`. Click arms. Armed click `cancelContract { c }` (`Y`). Not a new dialog. Not the `disabled` attribute.

Hover (armed or not): Overlay aside. Title `COMPANIES[offer.company].name`. Body **Cancelling this offer will incur a {Coin fee} penalty.** `{fee}` = `<Coin n={cancelFee(active, nowDay)} />`.

## History

Below the stack. One line each, `history` array order, at most `CONTRACT_HISTORY_MAX`. No `Label`. No header.

`COMPANIES[e.company].name`, `Difficulty`, `e.day`, outcome, amount `Coin`.

| `outcome.kind` | outcome | amount |
|---|---|---|
| `done` | Completed | `paid` |
| `missed` | Missed | `penalty` |
| `cancelled` | Cancelled | `fee` |

## Recap

Seam dialog [[ui/docks]]. When `unlock-contracts` done: that day's `Recap.contracts` as history lines (completed / missed / cancelled) and **A new board is up.** Omit the block when not unlocked.

Assumption: guest sees board and fill progress plus offer hover, Accept/Cancel/Reorder omitted. Demand faces are `'base'` quality 0. Group spirit face is vodka `'base'`. Cancel × hover title is the company name.
