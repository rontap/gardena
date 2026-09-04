# Station

Walk-up panel for the research station. Shape [[ui/store]]: Radix dialog + `Frame` `Shell`, optional width, hover `aside`. Opened by a walk-up cue, never from the rail. Not a dock. Not ObjectHud. Dump is a world act on the cell, not a control in the panel.

Rules [[mechanics/machines]] `station.cut` `station.io` `variety.copy`. Place [[ui/place]]. Look points here from [[ui/inspect]].

Assumption: empty `crop === 'none'` stores `variety: 'base'` and `quality: 0` until the first dump locks both.

Assumption: the type carries no freshness and no organic field, so returned fruit leaves at freshness 1 and not organic — [[mechanics/machines]].

## Type

```
ResearchStation = {
  crop: CropId | 'none'
  variety: VarietyId
  quality: number
  units: number
  progress: number
  inn: Signal
}
```

`units === 0` → `crop` `'none'`. `quality` 0..1, required. Illegal: optional `variety`. Illegal: optional `quality`.

`dest(station)` = `at`. 1×1. Pads, west pull, east push, `inn` port: mill. Dropoff north Unload, takeup south Load. Lens [[ui/sensors]].

SKU `buy-research-station`. Processing shelf. `show: 'start'`. `need: []`. `haggling`. Guest may shop, place, delete, dump, and open this panel.

Accepts `tier` `heirloom` fruit only, `cut === false`. First dump locks crop + Variety; later dumps must match. `STATION_IN` `STATION_SECONDS` `STATION_GRAFT_MIN` `STATION_GRAFT_MAX`. At `progress` 1: consume, emit `STATION_IN` fruit with `cut = true` **and** a rolled 1–2 grafts of that Variety, both at the input Quality. East store else `frontOf`; no room → wait.

The second face — feeding seed to earn a Variety — is not this panel.

Prop `off` / `on` from working. Reduced motion: frame 0. Atlas [[architecture/view]].

## Cue

`Cue` `|= { kind: 'station'; at }`. `App.Panel` `|= { kind: 'station'; at }`. `cued(kind)` covers chest, silo, additives, hangar, vehicle, station. Closing acks. A map click while open closes it, same as chest.

Walk-up opens the panel. It does not dump.

## Panel

Title **Grafting bench** — named for what the building becomes. `Shell` from [[ui/store]]. Width `w-[30rem]`.

| field | shows |
|---|---|
| Variety | locked Variety name, or empty copy **None yet** |
| Quality | `floor(quality * 100)%` of the hopper, or empty |
| grafts | **{min}–{max} grafts** out as `STATION_GRAFT_MIN`–`STATION_GRAFT_MAX` of that Variety |
| progress | `Bar` `value` 0..1, `bg-leaf` on `bg-ink/25`, same as a research run |

No withdraw grid. No deposit control. Footer **Dump Heirloom fruit on the bench. Walking up does not dump.**

## Look

Either the walk-up prompt or the dump prompt, not both. Dump legal → prompt is the verb. Else prompt is the look line.

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Grafting bench** |
| filling | **Grafting bench - {Variety} {have}/{need} · Quality {n}%** |
| wrong locked | **{Variety} only** |
| refuse not heirloom / already `cut` | **Heirloom fruit only** |
| working | **Grafting bench - working {pct}%** |
| paused (`inn === 1`) | **Grafting bench - Paused by wire** |
| ready, output blocked | **Grafting bench - Output blocked** |

`{pct}` = `floor(progress * 100)`. `{need}` = `STATION_IN`.

Prompt dump legal: **Cut grafts**. `{ act: 'station'; at }`. Prompt walk-up: the look line for the state the bench is in, not a bare title. `{ act: 'station'; at }` opens the cue when dump is not legal. The prompt and the look line are then the same string, so the hover reads once instead of twice — [[ui/inspect]].

No covering haste line. No live recipe row.

## Held out

Cut fruit is otherwise ordinary — sells, jams, stills, held line as fruit. Graft held line [[ui/inspect]].
