# Station

Walk-up panel for the research station. Player name **Seed Variety Station**. Shape [[ui/store]]: Radix dialog + `Frame` `Shell`, optional width, hover `aside`. Opened by a walk-up cue, never from the rail. Not a dock. Not ObjectHud. Dump is a world act on the cell, not a control in the panel.

Rules [[mechanics/machines]] `station.many` `station.io` `familiarity.gain` `familiarity.cost` `familiarity.refuse`. Place [[ui/place]]. Look points here from [[ui/inspect]]. Size [[items/buildings]] `station`.

Any number per farm. Every station reads and writes the one `World.familiarity` record, so the panel shows the same rows whichever one you walk up to — [[mechanics/machines]] `station.many`.

Empty (`crop === 'none'`) stores `variety: 'base'` and `quality: 0` until the first dump locks both. `units === 0` → `crop` `'none'`. Illegal: optional `variety`. Illegal: optional `quality`.

`quality` is still mixed on every dump and still round-trips through the save, but nothing reads it: familiarity comes from the variety tier, not the quality. It is kept for [[plans/next-variant]] and is dead until then, like fruit `cut` — [[mechanics/machines]].

SKU `buy-research-station`. Automation shelf. Unlock and show `unlock-crop-variants`. Guest may buy, place, demolish, dump, and open this panel. Demolish reads **Demolish Seed Variety Station** and clears both cells — [[ui/place]]. Not on the shelf until Crop variants is done.

The second face — feeding seed to earn a Variety — is [[plans/next-variant]]. Not this panel.

Prop `off` / `on` from working — [[art/machines]].

## Cue

`Cue` `|= { kind: 'station'; at }`. `App.Panel` `|= { kind: 'station'; at }`. `cued(kind)` covers chest, silo, additives, hangar, vehicle, station. Closing acks. A map click while open closes it, same as chest.

Walk-up opens the panel. It does not dump.

## Panel

Title **Seed Variety Station**. `Shell` from [[ui/store]]. Width `w-[30rem]`.

One row per `GrownCrop` whose familiarity is above 0, in `GROWN_IDS` order: the fruit glyph, the crop name, `{n}/{max}` against that crop's `familiarityMax`, and a `Bar` at `n / familiarityMax(crop)`. The cap differs by crop, so the rows do not share a denominator. Row shape follows the Necronomicon's page rows — [[ui/necronomicon]].

No crop above 0 → the empty line alone, no rows, no zero rows.

Below the rows, only while `crop !== 'none'`: the locked Variety name and a `Bar` at `progress` for the fruit being studied.

No withdraw grid. No deposit control. No craft row: the station is not a `MachineId`.

## Look

Either the walk-up prompt or the dump prompt, not both. Dump legal → prompt is the verb. Else prompt is the look line.

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Seed Variety Station** |
| holding fruit whose crop is at the cap | **Seed Variety Station - Nothing left to learn about {Crop}** |
| holding fruit against a different lock | **Seed Variety Station - {Variety} only** |
| paused (`inn === 1`, `units > 0`) | **Seed Variety Station - Paused by wire** |
| studying | **Seed Variety Station - {Variety} · {n} left · {pct}%** |

`{pct}` = `floor(progress * 100)`. `{n}` = `units`.

Prompt dump legal: **Analyze**. `{ act: 'station'; at }`. Prompt walk-up: the look line for the state the station is in, not a bare title. `{ act: 'station'; at }` opens the cue when dump is not legal. The prompt and the look line are then the same string, so the hover reads once instead of twice — [[ui/inspect]].

No covering haste line. No live recipe row. No output blocked state: there is no output.
