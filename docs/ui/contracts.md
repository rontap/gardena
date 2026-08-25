# Contracts

Tab on [[ui/market]]. Panel stays `{ kind: 'market' }`. Hidden iff `!world.done.has('unlock-contracts')`. [[mechanics/contracts]].

`slots = CONTRACT_OFFERS +` (broker ≥ 1 ? 1 : 0). Cap `CONTRACT_ACTIVE +` (broker ≥ 2 ? 1 : 0). Board `rollBoard(world.rng, world.clock.day, slots)`. Drop ids in `takenToday` — those cards are gone. Regenerating is free. Panel does not re-roll mix / amount / fee lerp; remaining days and live cancel fee are display (`nowDay` as mechanics, `cancelFee(active, nowDay)`).

Host: Accept / Cancel / Reorder. Guest: board and fill progress; those controls omitted. Guest cmds never fire. [[ui/multiplayer]]

`#debug-contracts` — generator ladder, not the overlay. [[ui/cheat]]

## Split

`Tabs.Content` `contracts`: `grid grid-cols-2 min-h-0 flex-1`. Split down the middle.

Left: today's board. `overflow-hidden`. No `scroll-pane`. No `overflow-y-auto`. Overlay still no-scroll — [[ui/market]] `w-[52rem]` unchanged.

| broker | grid | cards |
|---|---|---|
| 0 | `grid grid-cols-2 grid-rows-3 gap-2` | 6 |
| T1+ | `grid grid-cols-2 grid-rows-4 gap-2` | 7 |

Not 8. Slot 7 unused. Empty cells stay empty. Type [[ui/type]].

Right: `flex min-h-0 flex-col`. Left pane `border-r border-ink/20`.

Empty iff `active.length === 0` and `history.length === 0`: **No contracts running.** `flex items-center justify-center text-sm text-ink/50`. Else accepted stack, history below. Right may `min-h-0 overflow-y-auto scroll-pane` so the board does not scroll.

## Offer card

The card is the Accept control. Not a nested label. `button`. `bg-ink/6 px-3 py-2 flex flex-col gap-1`. Host click `acceptContract { c: offer.id }`.

At cap: grey `text-ink/35`, `aria-disabled`, guarded `onClick`. Not the `disabled` attribute. [[ui/callout-hover]] on Market Overlay `aside`. Title `COMPANIES[offer.company].name`. Why, `mt-2 block font-bold text-roof`:

- cap 3: **Three contracts already running.**
- broker T2 (cap 4): **Four contracts already running.**

Taken today: card gone, not grey.

```
[ face name                            stars ]
[ {amount} × face  [pips]              {n}%  ]
[ {amount} × face  [pips]                    ]   ← pair only
[ {days} days                      Coin      ]
```

Row 1: `flex items-center justify-between gap-2`. Company `flex items-center gap-2`: face `company-{id}.svg` `h-6 w-6 shrink-0` (24×24, `viewBox="0 0 24 24"`) left of `COMPANIES[offer.company].name` `text-sm font-semibold`. Stars `h-4`.

Amount rows: `flex items-center gap-2 text-base font-semibold`. `{amount}` `×` face. Markup on the first amount row only, `ml-auto text-sm font-normal`. `{Math.round(offer.markup * 100)}%`. Pair: two amount lines.

Last row: `flex items-center justify-between text-sm`. `{offer.days} days`. `<Coin n={offer.reward} />`.

### Company

Name is `COMPANIES[offer.company].name`. Complete book — all six `CompanyId`: `whole-cart` `trade-jo` `halbert-eijn` `little-lid` `mercanova` `intercrop`. Art `company-{id}.svg` for six. Lookup does not special-case a stub three.

### Line face

Amount is the text, not the badge. Count / liters on the face is 1.

| demand | face |
|---|---|
| rated crop | fruit `ItemFace`, `rarity: minRarity`. Sugar-cane is cane fruit, not the bag. |
| rated wine | wine `ItemFace`, `rarity: minRarity` |
| rated spirit | that spirit `ItemFace`, `rarity: minRarity` |
| plain sugar / oil / flour / extract | that `ItemFace` |
| plain jam | jam `ItemFace` (`JamId` crop; tomato ketchup) |
| group jam | jam-machine Face (`item-jam-machine`, same 24×24 plate as `ItemFace`, no badge) |
| group spirit | vodka spirit `ItemFace`, `rarity: minRarity` |

`qualityPip(minRarity)` beside the face when the demand carries `minRarity` and `minRarity !== 'common'`. Fruit `ItemFace` already composites that pip — do not draw a second mark on the fruit glyph. Do not use `qualityPip` for stars.

### Stars

`ui-contract-stars` groups `s1` `s2` `s3` `s4`. Show group `s{offer.stars}` only. `Stars` is `1 | 2 | 3 | 4`. Same sibling-`<g id>` rule as other grouped art. Do not draw four loose marks.

## Accepted

`world.contracts.active` array order — that is fill order. Same card frame `bg-ink/6 px-3 py-2 flex flex-col gap-1`. Stacked `flex flex-col gap-2`.

```
[ face name                            stars ] [▲]
[ {remaining} × face  [pips]                 ] [▼]
[ {remaining} × face  [pips]                 ]
[ {x.x} days left              Coin reward   ]
[ Bar                                        ]
[ Cancel  Coin(fee)                          ]
```

Remaining per line: `amount - filled`. Same faces and pips as the offer. `{x.x} days left` — one decimal, `tabular-nums`, `dueDay - nowDay`. `Bar` `value={filled / need}` `color="bg-leaf"` `track="bg-ink/25"`. `need` / `filled` = sums of line amounts / `bin.filled`. Reward `<Coin n={offer.reward} />`.

Reorder host only: ▲ `reorderContract { c, d: -1 }`, ▼ `{ c, d: 1 }`. `d = 1` toward the end. Ends: still shown, sim no-op. No extra disabled face.

### Cancel

Host `Btn`. Shows the live fee `<Coin n={cancelFee(active, nowDay)} />`. Click → that card armed (confirm). Armed `Btn` `selected`, still the live fee. Second click `cancelContract { c }` (`Y`). Not a new dialog. Not the `disabled` attribute.

## History

Below the stack. One line each, `history` array order, at most `CONTRACT_HISTORY_MAX`. No `Label`. No header.

`COMPANIES[e.company].name`, `ui-contract-stars` `s{e.stars}`, `e.day`, outcome, amount `Coin`.

| `outcome.kind` | outcome | amount |
|---|---|---|
| `done` | Completed | `paid` |
| `missed` | Missed | `penalty` |
| `cancelled` | Cancelled | `fee` |

## Recap

Seam dialog [[ui/docks]]. When `unlock-contracts` done: that day's `Recap.contracts` as history lines (completed / missed / cancelled) and **A new board is up.** Omit the block when not unlocked.

Assumption: guest sees board and fill progress, Accept/Cancel/Reorder omitted. Group spirit face is vodka at `minRarity`.
