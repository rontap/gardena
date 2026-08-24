# Family

Skill screen. Roles stay: player gardens, husband research, daughter stall. No Family class. No XP. `World.family` always.

Ids: `player` | `husband` | `daughter`.

```
PlayerSkillId = boots | driving-classes | tending | vanilla-tending | seed-bank | better-carrot | better-potato | better-wheat | better-tomato | better-raspberry | better-watermelon | better-olive | better-grape | better-vanilla | better-sugar-cane
HusbandSkillId = research-speed | machinery | contracts | forecast | tax | water-study | land-study
DaughterSkillId = saleswoman | heirloom | bio | industrial | open-late | open-24 | jam | clearance
```

Illegal: `better-apple`, `better-apricot`, `better-lemon`, `better-cherry`, `better-berry`. Illegal: player `machinery`. Illegal: husband `tool-contracts` `machine-contracts` `bulk-buying`. Owned maps are per member.

Names and blurbs live in `SKILLS`. Hover uses `skillBlurb(id, tier)` — jam names the rank’s freshness cap; seed-bank names the rank’s shop pack odds.

## State

```
MemberState = { points, pickCount, owned: id → tier, offers: { id, tier }[] }
Family = { player, husband, daughter }
```

Start: `points` 0, `pickCount` 0, `owned` empty, offers rolled. Missing owned key = not owned. `offers` length 0..3.

`forecast` max 1. `driving-classes` max 3. `contracts` max 3. `industrial` max 3 (dummy). `jam` max 3. `bio` max 3. `seed-bank` max 5. Else `SKILLS.maxTier`. Illegal: tier 0. Illegal: tier > max.

Ranked `%` and `$` add per owned tier (`5+5+5`), they do not multiply. Jam uses the per-tier floor table.

## Points

Each seam, each member gets +1. Bank per member.

`grantPoint(member)`: `points += 1`.

`dismissRecap()` is the only recap exit — [[mechanics/day]]. Grants player, husband, and daughter, then `seam = play`, `banner = 2`. No pick.

`unlockAll`: every research id done, `money += 999`, job idle, each member `points = 99`. Does not grant skills. Does not reroll.

## Offers

Pool = that member’s ids with `owned < max` (or absent) and gate met.

Offered tier = owned + 1 (absent → 1).

Draw `min(3, pool.length)` distinct, no padding. Sort pool by id. Without replacement, slot `i` = `floor(skill.at(memberIx, pickCount, i) * remaining)`. — [[mechanics/rng]]

Offers exist at init. Persist until pick. Research done does not reroll.

`pickSkill(member, slot)`: spend 1 of **that** member’s points, `owned[id] = offered.tier`, `pickCount++`, reroll that member only.

Illegal: pick at 0 points. Illegal: slot past `offers.length`. Illegal: another member’s id.

## Gates

| id | requires |
|---|---|
| `open-24` | daughter owns `open-late` |
| `heirloom` | research `unlock-heirloom` done |
| `better-tomato` | research `unlock-tomato` done |
| `better-raspberry` | research `unlock-raspberry` done |
| `better-watermelon` | research `unlock-watermelon` done |
| `vanilla-tending` | research `unlock-raspberry` done |
| `better-olive` | research `unlock-olive` done |
| `better-grape` | research `unlock-grape` done |
| `better-vanilla` | player owns `vanilla-tending` |
| `better-sugar-cane` | research `unlock-fermentation` done |
| `driving-classes` | research `unlock-vehicles` done |
| else | none |

Carrot / potato / wheat better: eligible until owned.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. `dest` = `at`.

Legal: player owns `tending`, empty hand, plot `growing`, `plant.tended === false`. Work `TEND_WORK` 0.7s. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`.

`Plant.tended` required, starts `false`, same instance through ripe / dead — [[mechanics/plants]]. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe.

## Market hours

`marketOpen(phase)` — [[mechanics/market]].

| phase | open |
|---|---|
| sunrise, day | always |
| sunset | daughter owns `open-late` |
| twilight | daughter owns `open-24` |

Consign always. Sell all illegal when closed.

Closed copy: “Stall closed until morning.” / “Stall closed at twilight.”

## Sale

`better-*` → `Modifier` `{ source: 'skill', crop, saleMul: 1.04 }` and ripen `extraUp1` `BETTER_UP1` 0.04 — [[mechanics/plants]]. No research `sale-mul`. No `bump-*`.

`Modifier.source = 'research' | 'fertilizer' | 'skill'`.

At `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: `rarity === 'heirloom'` of crop fruit, spirit, wine × `(1 + 0.05 × tier)`. Not sugar / jam / oil / flour / extract
- bio: crop fruit `bio === true` × `(1 + 0.04 × tier)`. Not sugar / machine goods
- jam: `freshMul` floored to `0.10 / 0.20 / 0.30` by owned tier. Not the jam machine
- clearance: freshness-0 fruit `$1` each. Else jam floor. Sugar and machine goods do not rot

Crop stall bins: stock + worth per rarity × bio. Illegal: consign that drops `fruit.bio`.

## Other effects

- boots: `WALK × (1 + 0.05 × tier)`
- driving-classes: burn `× (1 − 0.05 × tier)`, Quad/Tractor `vMax` and accel `× (1 + 0.05 × tier)`. Additive ranks. Yaw not. Boots not. — [[mechanics/vehicles]]
- machinery: `GRIND_WORK`, valve 0.3s, mill tick, jam tick `÷ (1 + 0.05 × tier)` only. Not Quad/Tractor vMax/accel. Still / barrel not work jobs. Pipe place stays 0
- research-speed: `job.left -= dt × (1 + 0.05 × tier)`
- contracts: utility AND automation tab `skuPrice` `− $tier` then min $1. Hangar-buys still not `skuPrice`
- tax: expansion formula then `× (1 − 0.02 × tier)` then min $1 — [[mechanics/expansion]]
- water-study: unlocks water lens. Water lens gated until owned
- land-study: unlocks land lens
- `buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`. Ctrl still shop gesture. `buy(id)` stays one. Failed afford / fit / closed: no-op
- seed-bank: shop `pack-*` rarity is `rollShopRarity(tier, shop.next())`. Base (tier 0): always common. Per rank: `SEED_BANK_CHANCE` 5% uncommon, 1.2% rare, 0.2% heirloom, mutually exclusive, heirloom first. `buy` one `next()` per granted pack. `buyPacks` five. Failed afford / fit / closed: 0. Merges by rarity, needs a house slot per new rarity. Catalog icon stays common. Not `clock.t`. Not `money`. — [[mechanics/rng]]
- forecast / industrial: dummy

Assumption: `SkillEffect` `{ kind: 'driving-classes' }` `{ kind: 'contracts' }` `{ kind: 'machine' }` on husband.
