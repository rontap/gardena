# Family

HUD panel + `World` fields. Not XP. No “has family” flag. No `Family` class.

Ids: `sim/ids.ts`. Table: `defs/skills.ts`. Mutation: `World`. Chrome: `ui/family.tsx` (panel), `ui/recap.tsx` (point). Art: [[art/skills]].

## Ids

```
MemberId = 'player' | 'husband' | 'daughter'

PlayerSkillId =
  | 'boots'
  | 'machinery'
  | 'tending'
  | 'vanilla-tending'
  | 'seed-bank'
  | 'better-carrot'
  | 'better-potato'
  | 'better-wheat'
  | 'better-tomato'
  | 'better-raspberry'
  | 'better-watermelon'
  | 'better-grape'
  | 'better-olive'
  | 'better-vanilla'
  | 'better-sugar-cane'

HusbandSkillId =
  | 'research-speed'
  | 'tool-contracts'
  | 'machine-contracts'
  | 'forecast'
  | 'tax'
  | 'water-study'
  | 'land-study'
  | 'bulk-buying'

DaughterSkillId =
  | 'saleswoman'
  | 'heirloom'
  | 'bio'
  | 'industrial'
  | 'open-late'
  | 'open-24'
  | 'jam'
  | 'clearance'

SkillId = PlayerSkillId | HusbandSkillId | DaughterSkillId
```

Illegal: `better-*` on `TreeId`. No `better-apple`. Illegal: player owns `saleswoman` — owned maps are per member, each id set closed.

## Defs

`SKILLS` in `defs/skills.ts`. Not on `World`.

```
SkillRef<Id> = { id: Id; tier: number }

SkillGate =
  | { kind: 'none' }
  | { kind: 'research'; id: ResearchId }
  | { kind: 'skill'; id: 'open-late' }

SkillDef<Id> = { id: Id; maxTier: number; gate: SkillGate; effect: SkillEffect }
```

`maxTier` 1 = one-shot. `forecast` max 1. `industrial` max 5. Both `effect: { kind: 'dummy' }`. `seed-bank` max 5.

Gates — only these:

| id | gate |
|---|---|
| `open-24` | owned daughter `open-late` |
| `heirloom` | research `unlock-heirloom` |
| `better-tomato` | research `unlock-tomato` |
| `better-raspberry` | research `unlock-raspberry` |
| `better-watermelon` | research `unlock-watermelon` |
| `better-grape` | research `unlock-grape` |
| `better-olive` | research `unlock-olive` |
| `vanilla-tending` | research `unlock-raspberry` |
| `better-vanilla` | skill `vanilla-tending` |
| `better-sugar-cane` | research `unlock-fermentation` |
| else | `none` |

Carrot / potato / wheat better: always eligible until owned. No extra gates.

`SkillEffect` arms. Amounts live in `SKILLS`. Ranked `%` and `$` add per owned tier, not multiply: Boots I–V walk `WALK × (1 + 0.05 × tier)`. Machinery / research-speed same 5% add. Tax `× (1 − 0.02 × tier)`. Saleswoman `+2%` per tier, Őstermelő `+5%`, bio `+3%`. Contracts `−$1` per tier, min $1. Jam: `minFreshMul[tier-1]` is 0.10 / 0.20 / 0.30 / 0.40 / 0.50.

```
SkillEffect =
  | { kind: 'walk'; mul: 1.05 }
  | { kind: 'machine'; mul: 1.05 }
  | { kind: 'tend' }
  | { kind: 'vanilla-tending' }
  | { kind: 'research-speed'; mul: 1.05 }
  | { kind: 'tool-contracts' }
  | { kind: 'machine-contracts' }
  | { kind: 'tax'; mul: 0.98 }
  | { kind: 'water-study' }
  | { kind: 'land-study' }
  | { kind: 'bulk-buying' }
  | { kind: 'saleswoman'; mul: 1.02 }
  | { kind: 'heirloom'; mul: 1.05 }
  | { kind: 'better'; crop: AnnualId; saleMul: 1.04; up1: 0.04 }
  | { kind: 'seed-bank' }
  | { kind: 'bio'; mul: 1.03 }
  | { kind: 'open-late' }
  | { kind: 'open-24' }
  | { kind: 'jam'; minFreshMul: [0.10, 0.20, 0.30, 0.40, 0.50] }
  | { kind: 'clearance' }
  | { kind: 'dummy' }
```

`walk` = boots. `machine` = machinery (`GRIND_WORK`, valve 0.3s, mill tick, jam tick; still / barrel not work jobs; pipe place instant). `tend` work `TEND_WORK` 0.7s. `saleswoman` = every `StallGoodId`. `heirloom` = `rarity === 'heirloom'` on crop fruit, spirit, wine. `bio` = `fruit.bio === true`. `tax` after expansion formula, then `× (1 − 0.02 × tier)`, min $1. Contracts: tab SKU `−$tier`, min $1.

## World fields

Type `Family` on `world.ts`. Field `World.family`. Always present.

```
MemberState<Id> = {
  points: number
  pickCount: number
  owned: Map Id → tier
  offers: SkillRef<Id>[]
}

Family = {
  player: MemberState<PlayerSkillId>
  husband: MemberState<HusbandSkillId>
  daughter: MemberState<DaughterSkillId>
}
```

Start of run: `points` 0, `pickCount` 0, `owned` empty, offers rolled. Missing owned key = not owned. `offers` length 0..3.

Illegal: tier 0. Illegal: tier > `maxTier`. Illegal: optional `Family`. Illegal: `recipient?: MemberId` on `Recap`.

## Offers

Pool = that member’s ids where `owned` tier < max (or absent) and gate met. Ineligible ids are not in the pool.

Roll: `skill.at(memberIx, pickCount, i)` — [[architecture/rng]]. Draw `min(3, pool.length)` distinct. No padding. 0–3.

Offers exist at init. Persist until a pick. Research completing does not reroll.

`pickSkill(member, slot)`: `slot` is an index into that member’s `offers`. Costs 1 of **that** member’s points. Writes `owned[id] = offered.tier`. `pickCount += 1`. Rerolls **only** that member’s three. Others unchanged.

Illegal: pick at 0 points. Illegal: slot past `offers.length`. Illegal: pick another member’s id.

`offers(member)` reads that member’s current three (or fewer).

## Points / recap

Each seam, each member +1. Unused bank per member.

`grantPoint(member)`: `points += 1`.

`dismissRecap()` is the only recap exit. Grants +1 to player, husband, and daughter, then `seam = play`, `banner = 2`. No member pick.

`unlockAll`: research rows unchanged (every id done, `money += 999`, job idle) **and** each member’s `points = 99`. Does not pick skills. Does not reroll offers.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. `dest` = `at`.

Legal: player owns `tending`, empty hand, plot `growing`, `plant.tended === false`. Work `TEND_WORK` 0.7s. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`.

`Plant.tended: boolean` required, starts `false`. Same instance through ripe / dead. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe.

## Market hours

`marketOpen(phase: DayPhase): boolean`

| phase | open |
|---|---|
| sunrise, day | always |
| sunset | daughter owns `open-late` |
| twilight | daughter owns `open-24` |

`open-24` implies `open-late` (gate). Consign legal in every phase. Sell all illegal when `marketOpen` is false.

## Sale

`better-*` → `Modifier` `{ source: 'skill', crop, saleMul: 1.04 }` and ripen `extraUp1` 0.04. No research `sale-mul`. No `bump-*`.

`Modifier.source = 'research' | 'fertilizer' | 'skill'`.

Other sale skills at `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: `rarity === 'heirloom'` of crop fruit, spirit, wine × `(1 + 0.05 × tier)`
- bio: crop fruit with `bio === true` × `(1 + 0.03 × tier)`. Not sugar / machine goods
- jam: `freshMul` floored to that tier’s min. Not the jam machine
- clearance: freshness-0 item-kind fruit → $1 each, regardless of crop/rarity. Else jam floor. Sugar and machine goods do not rot

Crop stall bins keep `bio` (stock + worth per rarity × bio). Illegal: consign that drops `fruit.bio`.

## Other effects

- Boots: walk step `WALK × (1 + 0.05 × tier)`
- Machinery: `GRIND_WORK`, valve 0.3s, mill tick, jam tick durations ÷ `(1 + 0.05 × tier)`. Still / barrel not work jobs. Pipe place stays 0
- Research speed: `job.left -= dt × (1 + 0.05 × tier)`
- `skuPrice(id)`: `SKUS[id].price`, then `− tier` if tool-contracts and `Sku.tab === 'utility'`, or machine-contracts and `tab === 'automation'`; min $1. Seeds and building tiles unchanged. Buy / place spend `skuPrice`
- `Sku.tab` on `defs/research.ts`: `'seeds' | 'utility' | 'automation' | 'building'` — same membership as [[ui/shop]]
- Bulk: seed SKU, husband owns `bulk-buying` → `buyPacks(id)` five packs at `5 * skuPrice(id) * 0.95`. Else no-op. `buy(id)` stays one
- Seed-bank: `rollShopRarity(tier, u)` on shop packs. `SEED_BANK_CHANCE` per rank. `buy` one roll; `buyPacks` five. Base always common.
- Tax: `World.tax()` applies smart tax after the expansion formula
- Water lens: husband owns `water-study`. Land lens (`land`): husband owns `land-study`. View-local `Lens`; architecture names the unlock. Default `off`

## Research

Drop `ResearchId` `bump-carrot` `bump-potato` `bump-wheat`. Drop `ResearchDef.effect` arm `{ kind: 'sale-mul'; … }`.

```
effect = { kind: 'unlock-sku'; sku: SkuId } | { kind: 'expand' } | { kind: 'feature' }
```
