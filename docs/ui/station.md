# Station

Walk-up panel for the research station. Player name **Seed Variety Station**. Shape [[ui/store]]: Radix dialog + `Frame` `Shell`, optional width, hover `aside`. Opened by a walk-up cue, never from the rail. Not a dock. Not ObjectHud. Dump is a world act on the cell, not a control in the panel.

Rules [[mechanics/machines]] `station.cut` `station.io` `variety.copy`. Place [[ui/place]]. Look points here from [[ui/inspect]]. Size [[items/buildings]] `station`.

Empty (`crop === 'none'`) stores `variety: 'base'` and `quality: 0` until the first dump locks both. `units === 0` → `crop` `'none'`. Illegal: optional `variety`. Illegal: optional `quality`. Returned fruit freshness and organic: [[mechanics/machines]].

SKU `buy-research-station`. Automation shelf. Unlock and show `unlock-crop-variants`. Guest may buy, place, demolish, dump, and open this panel. Demolish reads **Demolish Seed Variety Station** and clears both cells — [[ui/place]]. Not on the shelf until Crop variants is done.

The second face — feeding seed to earn a Variety — is [[plans/next-variant]]. Not this panel.

Prop `off` / `on` from working — [[art/machines]].

## Cue

`Cue` `|= { kind: 'station'; at }`. `App.Panel` `|= { kind: 'station'; at }`. `cued(kind)` covers chest, silo, additives, hangar, vehicle, station. Closing acks. A map click while open closes it, same as chest.

Walk-up opens the panel. It does not dump.

## Panel

Title **Seed Variety Station** — named for what the building becomes. `Shell` from [[ui/store]]. Width `w-[30rem]`.

| field | shows |
|---|---|
| Variety | locked Variety name, or empty copy **None yet** |
| Quality | `floor(quality * 100)%` of the hopper, or empty |
| grafts | **{min}–{max} grafts** out as `STATION_GRAFT_MIN`–`STATION_GRAFT_MAX` of that Variety |
| progress | `Bar` `value` 0..1, `bg-leaf` on `bg-ink/25`, same as a research run |

No withdraw grid. No deposit control. Footer **Dump Heirloom fruit on the station. Walking up does not dump.**

## Look

Either the walk-up prompt or the dump prompt, not both. Dump legal → prompt is the verb. Else prompt is the look line.

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Seed Variety Station** |
| filling | **Seed Variety Station - {Variety} {have}/{need} · Quality {n}%** |
| wrong locked | **{Variety} only** |
| refuse not heirloom / already `cut` | **Heirloom fruit only** |
| working | **Seed Variety Station - working {pct}%** |
| paused (`inn === 1`) | **Seed Variety Station - Paused by wire** |
| ready, output blocked | **Seed Variety Station - Output blocked** |

`{pct}` = `floor(progress * 100)`. `{need}` = `STATION_IN`.

Prompt dump legal: **Cut grafts**. `{ act: 'station'; at }`. Prompt walk-up: the look line for the state the station is in, not a bare title. `{ act: 'station'; at }` opens the cue when dump is not legal. The prompt and the look line are then the same string, so the hover reads once instead of twice — [[ui/inspect]].

No covering haste line. No live recipe row.

## Held out

Cut fruit is otherwise ordinary — sells, jams, stills, held line as fruit. Graft held line [[ui/inspect]].
