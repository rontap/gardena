# Family

HUD panel + `World` fields. Not XP. No “has family” flag. No `Family` class.

Ids: `sim/ids.ts`. Table: `defs/skills.ts`. Mutation: `World`. Chrome: `ui/family.tsx` (panel), `ui/recap.tsx` (point). Art: [[art/skills]]. Rules: [[mechanics/family]].

Illegal: `better-*` on `TreeId`. Illegal: player owns `saleswoman` — owned maps are per member, each id set closed. Illegal: player `machinery`. Illegal: husband `contracts` `tool-contracts` `machine-contracts` `bulk-buying`.

## Defs

`SKILLS` in `defs/skills.ts`. Not on `World`. `maxTier` 1 = one-shot. `forecast` max 1. `driving-classes` max 3. `haggling` max 3. `broker` max `BROKER_MAX_TIER`. `industrial` max 3. `jam` max 3. `bio` max 3. `seed-bank` max 5. `forecast` is live — [[mechanics/weather]].

Gates: `open-24` needs `open-late`. `heirloom` needs `unlock-heirloom`. `better-carrot` `better-potato` `better-wheat` `seed-bank` need `unlock-crop-variants`. Crop `better-*` for researched crops need the matching research. `better-grape` needs `unlock-grape`. `better-vanilla` needs `unlock-raspberry`. `driving-classes` needs `unlock-vehicles`. `broker` needs `unlock-contracts`. `haggling` is `hidden`. Else none. No `better-*` on `TreeId`.

Carrot / potato / wheat better: always eligible until owned.

`SkillEffect` arms live in `SKILLS`. `{ kind: 'forecast' }`. No `{ kind: 'dummy' }`. Ranked `%` and `$` add per owned tier, not multiply. Hangar-buys still not `skuPrice`. Broker / industrial — [[mechanics/contracts]]. Forecast — [[mechanics/weather]].

## World fields

Type `Family` on `world.ts`. Field `World.family`. Always present. Shared `World.points`. Per member: `pickCount`, `owned`, `offers`.

Start of run: `World.points` 0, `pickCount` 0, `owned` empty, offers rolled. Missing owned key = not owned. `offers` length 0..3.

Illegal: tier 0. Illegal: tier > `maxTier`. Illegal: optional `Family`. Illegal: `recipient?: MemberId` on `Recap`.

## Offers

Pool = that member’s ids where `owned` tier < max (or absent) and gate met. Ineligible ids are not in the pool.

Roll: `skill.at(memberIx, pickCount, i)` — [[architecture/rng]]. Draw `min(3, pool.length)` distinct. No padding. 0–3.

Offers exist at init. Persist until a pick. Research completing does not reroll.

`pickSkill(member, slot)`: `slot` is an index into that member’s `offers`. Costs 1 of `World.points`. Writes `owned[id] = offered.tier`. `pickCount += 1`. Rerolls **only** that member’s three. Others unchanged.

Illegal: pick at 0 points. Illegal: slot past `offers.length`. Illegal: pick another member’s id.

## Points / recap

Each seam, `World.points += POINTS_PER_DAY`. Unused bank is shared.

`grantPoints(n)`: `World.points += n`.

`dismissRecap()` is the only recap exit. Grants `POINTS_PER_DAY`, then `seam = play`, `banner = 2`. No member pick.

`unlockAll`: research rows unchanged (every id done, `money += 999`, job idle) **and** `World.points = 99`. Does not pick skills. Does not reroll offers.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Plants unchanged: player owns `tending`, empty hand, plot `growing`, `plant.tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`.

Trees added: player owns `tending`, empty hand, `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`. Either cell of the 1×2. Work `TEND_WORK`. Then `chance += 0.15`, `tended = true`. No cap. Not pending. Not `{ on }`. Not juvenile. Prompt **Tend**. Witness `Tree.tended`. — [[mechanics/trees]] `trees.tend`

`Plant.tended: boolean` required, starts `false`. Same instance through ripe / dead. `Tree.tended: boolean` required, starts `false`. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe. Illegal: tend pending / `{ on }` / juvenile tree.

`SKILLS.tending` blurb names plants and off-season trees. `SKILLS.clearance` blurb: rotten produce sells for $1 apiece.

## Market hours

`marketOpen(phase)` — [[mechanics/market]] [[mechanics/weather]]. Weather block: `(flood ∧ sunrise) ∨ (drought ∧ day)` unless `open-24`. `open-late` does not reopen. `open-24` implies `open-late` (gate). Consign legal in every phase. Sell all illegal when `marketOpen` is false.

## Sale

`better-*` → `Modifier` `{ source: 'skill', crop, saleMul }` and ripen `extraUp1`. `Modifier.source = 'research' | 'fertilizer' | 'skill'`.

Other sale skills at `marketGain`, not crop `Modifier` — [[mechanics/family]]. Crop stall bins keep `bio`. Illegal: consign that drops `fruit.bio`. Clearance subject is `{ kind: 'rotten' }`, not 0% fruit.

## Other effects

- Boots: walk step `WALK × (1 + 0.05 × tier)`
- driving-classes: burn `× (1 − 0.05 × tier)`, Quad/Tractor `vMax` and accel `× (1 + 0.05 × tier)`. Yaw not. Boots not. — [[mechanics/vehicles]]
- Machinery (husband): `GRIND_WORK`, valve 0.3s, mill tick, jam tick durations ÷ `(1 + 0.05 × tier)` only. Not Quad/Tractor vMax/accel. Still / barrel not work jobs. Pipe place stays 0
- Research speed: `job.left -= dt × (1 + 0.05 × tier)`
- `skuPrice(id)`: `SKUS[id].price`, then `− tier` if `haggling` and `Sku.tab === 'utility' | 'automation'`; min $1. Drought then ×2 if `tab === 'seeds' | 'utility'`. Hangar-buys still not `skuPrice`. — [[mechanics/weather]]
- `buyPacks(id)` always legal: five seed packs at `5 * skuPrice(id) * 0.95`
- Seed-bank: `rollShopRarity(tier, u)` on shop packs. `SEED_BANK_CHANCE` per rank. Base always common
- Tax: `World.tax()` applies smart tax after the expansion formula
- Water lens: husband owns `water-study`. Land lens: husband owns `land-study`. Vehicle interactions lens: `unlock-vehicles` in `done`, not a family-study. View-local `Lens`
- forecast: `{ kind: 'forecast' }`. HUD tomorrow iff husband owns it. Blurb locked on [[mechanics/weather]]

Assumption: `SkillEffect` `{ kind: 'haggling' }` `{ kind: 'broker' }` `{ kind: 'industrial' }` `{ kind: 'forecast' }`. No `{ kind: 'dummy' }`.
