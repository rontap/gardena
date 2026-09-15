# Station

Walk-up panel for the research station. Player name **Crop Variety Station**. Shape [[ui/store]]: Radix dialog + `Frame` `Shell`, optional width, hover `aside`. Opened by a walk-up cue, never from the rail. Not a dock. Not ObjectHud. Dump is a world act on the cell, not a control in the panel.

Rules [[mechanics/machines]] `station.many` `station.io` `familiarity.gain` `familiarity.cost` `familiarity.refuse`. Place [[ui/place]]. Look points here from [[ui/inspect]]. Size [[items/buildings]] `station`.

Any number per farm. Every station reads and writes the one `World.familiarity` record, so the panel shows the same rows whichever one you walk up to — [[mechanics/machines]] `station.many`.

Empty (`crop === 'none'`) stores `variety: 'base'` and `quality: 0` until the first dump locks both. `units === 0` → `crop` `'none'`. Illegal: optional `variety`. Illegal: optional `quality`.

`quality` is still mixed on every dump and still round-trips through the save, but nothing reads it: familiarity comes from the variety tier, not the quality. It is kept for [[plans/next-variant]] and is dead until then, like fruit `cut` — [[mechanics/machines]].

SKU `buy-research-station`. Automation shelf. Unlock and show `unlock-crop-variants`. Guest may buy, place, demolish, dump, and open this panel. Demolish reads **Demolish Crop Variety Station** and clears both cells — [[ui/place]]. Not on the shelf until Crop variants is done.

The second face — feeding seed to earn a Variety — is [[plans/next-variant]]. Not this panel.

Prop `off` / `on` from working — [[art/machines]].

## Cue

`Cue` `|= { kind: 'station'; at }`. `App.Panel` `|= { kind: 'station'; at }`. `cued(kind)` covers chest, silo, additives, hangar, vehicle, station. Closing acks. A map click while open closes it, same as chest.

Walk-up opens the panel. It does not dump.

## Panel

Title **Crop Variety Station**. `Shell` from [[ui/store]]. `w-[46rem] min-w-[28rem] max-w-[92vw]`, body `max-h-[76vh] min-h-[26rem]`.

The panel redraws on its own `requestAnimationFrame` while it is open. The App only bumps its HUD counter on `act` reasons, so without that the progress bar and the countdown stand still while the station works.

Three parts, top to bottom.

**Now.** Only while `crop !== 'none'`: **Researching now:**, the locked Variety, a `Bar` at `progress`, and the whole seconds left — `ceil((1 - progress) × stationSeconds(level))` of the locked crop's level. Then an `hr`.

**Crops.** One card per studied `GrownCrop` in `GROWN_IDS` order, stacked in a single column, scrolling when they overrun. A crop qualifies when it is a tree (tree seed and a graft of every tree Variety are in the starter kit), or when it has no pack SKU or that SKU is shown — the same gate the Seed silo uses, widened to cover trees and vanilla.

A qualifying crop at 0 gets no card. It appears instead as a greyed glyph — `opacity-25 grayscale`, the Necronomicon's own treatment for a slot not yet filled — in a centred row after the cards, with no name, bar or chip. With nothing studied that row is the whole list, and `hud_station_intro` sits above it explaining what the station is for.

Each card: the fruit glyph, the crop name, and either `{n}/{max}` with a `Bar` at `n / familiarityMax(crop)`, or **Completed** in `text-study` and no bar once `n` reaches the cap. The cap differs by crop, so the cards do not share a denominator.

Below that a `grid-cols-3` of chips — three fixed slots, so every card puts the same effect in the same column at one width.

| slot | chip | hover card |
|---|---|---|
| 1 | **+{n × FAMILIARITY_VAR_BONUS}% Variety chance** | what the ripen roll is, and that tending and a neighbouring Variety stack with it — [[mechanics/plants]] `plants.variety-roll` |
| 2 | **+{n × FAMILIARITY_SEED_QUALITY}% Shop seed quality** | silo and contract seed only; seed ground or dug keeps what it had |
| 3 | **+{n × FAMILIARITY_RECOVER}% Market price recovery** | why the price falls and climbs back, ending in the **{n × FAMILIARITY_RECOVER / SAT_STEP_FRUIT}** more fruit a day it buys — [[mechanics/saturation]] `familiarity.market` |

### Level chips

A second, wrapping chip row below the three. These appear as the crop's level passes each mark in `ALMANAC_AT` and the `*_AT` constants in `src/game/defs/varieties.ts`. Nothing behind them is built yet: the chips read the crop's real stats and Varieties, but studying a crop does not gate the Almanac page or hide a Variety anywhere else in the game.

| level | chip | colour |
|---|---|---|
| 2, 4, 6, 8 | **one** Almanac chip, the `ui-btn-almanac` glyph and the count of lines open so far, 1 to 4 | `bg-dirt/20`, the Almanac page |
| 10 | the crop's `variant`, as the base fruit glyph in the card header — not a chip | — |
| 12 | that variant's purpose, **Fresh** / **Preserving** / **Alcohol** | `bg-ripe/25`, orange-yellow |
| 14 | the crop's `heirloom`, as the base fruit glyph in the card header — not a chip | — |
| 16 | **Needs a neighbour** or **Grows alone** for that heirloom — [[mechanics/plants]] `variety.neighbour` | orange-yellow |
| 18 | that heirloom's purpose | orange-yellow |

The four Almanac marks share one chip: passing 4 does not add a second chip, it turns the 1 into a 2. Its hover card lists which lines are open. A mark whose Variety does not exist for that crop shows nothing — raspberry and cherry reach `heirloom` with no `variant`, so 10 and 12 never fire for them, and a `['base']` crop gets only the Almanac chip.

Fruit sold a day is not a chip of its own. It is the same number as slot 3 read in fruit rather than percent, so it lives in that slot's hover card.

Hovering a chip sets the panel's `tip` and draws a `CalloutHover` through `Shell`'s `aside`, the same way the Seed silo shows a seed — [[ui/store]].

Slot 1 is left empty for a crop whose `VARIETIES` row is `['base']` — it has no tier to reach, so the chance it earns buys nothing and claiming it would be a lie. The slot stays in place rather than closing up, so the other two keep their columns.

Both percent and fruit are rounded before they reach the string. `0.005 × 7 / 0.02` is `1.7500000000000002` in binary floating point and must never reach the player.

**Footer.** An `hr`, then muted **Place produce in the Crop Variety Station to learn more about each crop!**

Bars are `bg-study`, the dark blue token in `src/index.css`. No withdraw grid. No deposit control. No craft row: the station is not a `MachineId`.

## Look

Either the walk-up prompt or the dump prompt, not both. Dump legal → prompt is the verb. Else prompt is the look line.

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Crop Variety Station** |
| holding fruit whose crop is at the cap | **Crop Variety Station - Nothing left to learn about {Crop}** |
| holding fruit against a different lock | **Crop Variety Station - {Variety} only** |
| paused (`inn === 1`, `units > 0`) | **Crop Variety Station - Paused by wire** |
| studying | **Crop Variety Station - {Variety} · {n} left · {pct}%** |

`{pct}` = `floor(progress * 100)`. `{n}` = `units`.

Prompt dump legal: **Analyze**. `{ act: 'station'; at }`. Prompt walk-up: the look line for the state the station is in, not a bare title. `{ act: 'station'; at }` opens the cue when dump is not legal. The prompt and the look line are then the same string, so the hover reads once instead of twice — [[ui/inspect]].

No covering haste line. No live recipe row. No output blocked state: there is no output.
