# Variety earn

Feature. Graduates into [[mechanics/plants]], [[mechanics/research]], [[mechanics/machines]], [[ui/station]], [[ui/almanac]]. Copy: [[standards/user-facing-text]]. Contract Variety / Quality floors are a separate minor: [[plans/next-variant-patch]].

The Variety split shipped the identity and the cutting Station. How a named Variety is *earned* was cut. This note is that remainder: what is leftover from rarity, what already is Variety/Quality, and what the Station’s seed face does.

Assumption: starter packs of named annual Varieties stay. A new farm still holds them. The Station seed face is how you make more, and how a crop that has a variant or heirloom turns `'base'` seed into that Variety. Vanilla, chilli, carrot, sugar-cane have only `'base'` — the seed face refuses them. Vanilla stays contract prize and burrow.

## Live (keep)

Variety is identity, not a ladder. Set on sow, changed only by graft. One `Purpose` per named Variety. Quality bakes at ripen from happiness. No grow roll. No `Rarity`.

Seed Variety Station, cutting face: Heirloom fruit in, `cut` fruit and 1–2 grafts out. [[mechanics/machines]] `station.cut` `station.io`. Panel [[ui/station]].

`unlock-crop-variants` shows and unlocks `buy-research-station`. `unlock-heirloom` requires Crop variants. Daughter `heirloom` skill requires Heirloom research. Experienced potato / wheat grower require Crop variants. Variety sensor `need` Crop variants.

Starter: one pack of each named annual Variety in the Seed silo; four `'base'` tree seeds; one graft of every tree Variety. [[mechanics/inventory]].

## Leftover from rarity (remove or rewrite on this update)

These rows still exist. Their *effects* on grow, packs, and silo columns are already dead. The descriptions still describe the dead ladder.

| id | description today | what actually happens |
|---|---|---|
| `unlock-crop-variants` | A happy plant ripens Uncommon, Rare, or Heirloom. A neglected plant can yield lower rarity. | Ripen does not roll. Packs stay `'base'` quality 0. Silo columns do not hide. The row only shows the Station SKU and the skills / sensor above. |
| `unlock-heirloom` | Seed silo and Shop show Heirloom. Heirloom sells for more than Rare. | No Heirloom column. Packs stay `'base'`. The row only opens the daughter’s Heirloom skill. |

Dead copy also: `research_grant_rarity_rolls` `research_grant_silo_rows` `research_grant_heirloom_column` (unused `grants`). Almanac / aims sentences that still say rarity rolls. `better-*` still pays `saleMul` and `betterGain` Quality — that stays; any description that says a chance at superior fruit is leftover.

`buy-or` `buy-and` `buy-water-system` are not this update.

## New: Station seed face

Same building, same 2×1, same `inn`, pads, west store, east store. Two dump kinds. Hopper empty (`crop === 'none'` / `units === 0`) accepts either. Once locked, the other kind is refuse.

**Cut** — live. Heirloom fruit, `cut === false`. Unchanged.

**Seed** — this update. Accepts `{ kind: 'seeds' }` or `{ kind: 'tree-seed' }` of one crop and one Variety.

| in Variety | out | also needs |
|---|---|---|
| `'base'` | that crop’s `variant`, if it has one | Station already requires Crop variants |
| `'base'` | that crop’s `heirloom`, if it has no variant and has an heirloom | `unlock-heirloom` in `done` |
| that crop’s `variant` | that crop’s `heirloom`, if it has one | `unlock-heirloom` in `done` |
| anything else, including `'base'` on carrot / vanilla / chilli / sugar-cane | refuse | — |

Need `STATION_SEED_IN` seeds — preference, named next to `STATION_IN`. Quality of the output is the hopper mean. Count 1 seed or 1 tree-seed. East store else `frontOf`; no room → wait. Both outputs of a cut still land together; seed face emits one item.

Tree seed uses the same table. Apple `'base'` → `kingston-black` → `pink-lady`. Olive `'base'` → `arbequina`; `arbequina` in is refuse (no heirloom). Cherry `'base'` → `bing` after Heirloom research (no variant). Raspberry `'base'` → `black-raspberry` the same way. Potato / wheat / tomato-variant path unchanged.

Walk-up panel grows a second block when the hopper is seed: Variety in, Variety out, progress. Cut block stays when the hopper is fruit. Empty panel names both jobs. Footer names the dump that is legal, not both.

Look:

| when | text |
|---|---|
| empty | **Seed Variety Station** |
| seed filling | **Seed Variety Station - {in} → {out} {have}/{need} · Quality {n}%** |
| seed, Heirloom research missing on a variant hopper | **Needs Heirloom crops** |
| seed refuse (no next Variety) | **No further Variety** |

Dump prompt seed legal: **Make seed**. Fruit dump prompt stays **Cut grafts**.

`variety.copy` grows: seed face is the other copy path. Graft attach and axe grafts unchanged.

## Research after this update

`unlock-crop-variants` — you can buy the Station, and the Station’s seed face can turn `'base'` into that crop’s variant. Description rewritten. No ripen roll. No silo column.

`unlock-heirloom` — the Station’s seed face can turn variant into heirloom. Daughter Heirloom skill unchanged. Description rewritten. No Shop / silo Heirloom column.

`effect` stays `feature`. `skuOpen` / `done.has` stay the checks.

## Not this update

Contract offers naming a Variety or a Quality floor — [[plans/next-variant-patch]]. Removing starter packs. Named specialty alcohols. A shop pack of a named Variety.
