# Infusion

Infuser, chilli, flakes, vanilla-extract, infused goods. Stall [[mechanics/market]] [[mechanics/saturation]]. Board [[mechanics/contracts]]. Mill / furnace [[mechanics/machines]]. Crop [[mechanics/plants]]. Numbers preference unless marked.

Ids: `Infusable` `FurnaceRecipe` `StallGoodId` — `sim/ids.ts`.

Illegal: `ResearchId` `unlock-chilli`. Illegal: optional `infused`. Illegal: `{ kind: 'extract' }` from vanilla mill. Illegal: flakes or vanilla-extract as `StallGoodId`.

## Chilli

`AnnualId` += `chilli`. Class fruit. `VARIETIES.chilli` `['base']` only. No named Variety. No `better-chilli`.

`CROPS.chilli.growSeconds` 190 — preference. Slower than potato (`>` `CROPS.potato.growSeconds`). Faster than vanilla.

`CROPS.chilli.rotSeconds` — preference, `>` `CROPS.potato.rotSeconds`.

`pack-chilli` is `PACK_N` seeds, `'base'` quality 0, price 10. Show and buy `unlock-infusion`. No chilli research row. `packSku('chilli')` is `pack-chilli`. Vanilla still has no pack.

Ripe chilli harvests as fruit. Mill for flakes — [[#Flakes]]. Fruit is a stall good. Flakes are not.

## Vanilla-extract

Mill recipe `'vanilla'`: `MILL_VANILLA_IN` 1 fruit → `{ kind: 'vanilla-extract'; quality; count: MILL_VANILLA_OUT }` 4. `unitSale` none. Quality is the mean of what went in. Not the grass mill stall good. `millProductName('vanilla')` is vanilla extract. Grass mill stays `{ kind: 'extract' }` count 1, `EXTRACT`, quality 0, stall `'extract'`.

```
{ kind: 'vanilla-extract'; quality: number; count: number }
```

Illegal: `unitSale` on vanilla-extract. Illegal: vanilla mill `{ kind: 'extract' }`. Not stall. Not compost. Not furnace. Not grind. Infuser input.

## Flakes

Mill recipe `'chilli'`: `MILL_CHILLI_IN` 3 fruit → `{ kind: 'flakes'; quality; count: MILL_CHILLI_OUT }` 2. Quality is the mean of what went in. `millProductName('chilli')` is flakes. `MILL_RECIPES` order sugar-cane olive wheat grass vanilla chilli. `millNeed('chilli')` is `MILL_CHILLI_IN`.

```
{ kind: 'flakes'; quality: number; count: number }
```

Illegal: `unitSale` on flakes. Not stall. Not compost. Not furnace. Not grind. Infuser input.

## Infused

Required boolean on jam, cask, spirit, and oil. Machine output `false`. Infuser output `true`. Illegal: optional `infused`. Illegal: `infused` on fruit, sugar, flour, extract, flakes, vanilla-extract, bread, spirit omitted.

Oil is infusable.

```
Jam   = { kind: 'jam'; crop: JamCrop; variety: VarietyId; quality: number; count: number; unitSale: number; infused: boolean }
Cask  = { kind: 'cask'; cask: CaskId; variety: VarietyId; quality: number; count: number; unitSale: number; infused: boolean }
Oil   = { kind: 'oil'; quality: number; count: number; unitSale: number; infused: boolean }

Spirit =
  | { kind: 'spirit'; spirit: Exclude<SpiritKind, 'mixed'>; variety: VarietyId; quality: number; count: number; unitSale: number; infused: boolean }
  | { kind: 'spirit'; spirit: 'mixed'; quality: number; count: number; unitSale: number; infused: boolean }
```

`infused` is in the stack identity key. Infused never merges with plain. Same keys otherwise — [[mechanics/inventory]] `inventory.stack`. Infuser refuses `infused === true`.

`unitSale` and quality do not change at the Infuser. The flag is the difference. Stall and reputation read it — [[#Stall]] [[mechanics/contracts]] `contracts.infused`.

Face is the plain good plus `overlay-infused.svg` — [[ui/inspect]] [[architecture/view]] `view.infused-overlay`. No second product pane.

## Infuser

2×2 `Machine`. `RectBase` `w = MILL_W` `h = MILL_H`, origin NW, no rotate, same instance all four cells, `squareSiteOk`, hover origin extends east and south; pads two cells wide. Tick origin. Hit, ghost footprint, I/O, ports, pads stay 2×2. viewBox `48×48`. Pay on confirm. Disarm. Automation tab. `haggling`. Guest shop + place + delete + dump. `GUEST_BUILD` += `buy-infuser`. `dest(infuser)` = `at`.

| class | `kind` | sku | unlock |
|---|---|---|---|
| `Infuser` | `infuser` | `buy-infuser` | `unlock-infusion` |

`buy-infuser`: Automation shelf, show `unlock-preservatives`, buy `unlock-infusion`. `MachineId` += `infuser`. `machineOfSku('buy-infuser')` is `infuser`. `CraftCell` += `Infuser`. `inn: Signal`. Port `in` origin top. Pads `'both'`. `ticks` `hasted`. Unwired 0 ticks. `inn === 1` skip tick. Dump and Unload still fill. Not machinery. Not `machineMul`.

West pull, east push, mill. Pads mill. `IoCell` includes infuser. Covering haste look: mill set += infuser.

```
Infuser {
  base
  inn: Signal
  lock: Infusable | 'none'
  quality: number
  units: number
  flakes: number
  extract: number
  progress: number
}
```

```
Infusable =
  | { kind: 'jam'; crop: JamCrop; variety: VarietyId }
  | { kind: 'cask'; cask: CaskId; variety: VarietyId }
  | { kind: 'spirit'; spirit: Exclude<SpiritKind, 'mixed'>; variety: VarietyId }
  | { kind: 'spirit'; spirit: 'mixed' }
  | { kind: 'oil' }
```

Empty: `lock: 'none'`, `variety` unused, `quality` 0, `units` 0. First accepted good dump locks `Infusable`. Later goods must match. `units === 0` → `'none'`. Oil has no variety. Mixed spirit has no variety.

`INFUSE_IN` 1. `INFUSE_FLAKES` 1. `INFUSE_EXTRACT` 1. `INFUSE_SECONDS` 90 — preference. `INFUSE_SECONDS` is `fixed`. Not `work`. Not `machineMul`. Not machinery. `furnaceMul` multiplies progress. Catalog `clockText` stays nominal.

Dump good: jam / cask / spirit / oil, `infused === false`. Refuse infused, fruit, sugar, flour, extract, bread, flakes-as-good, vanilla-extract-as-good, seeds, tools. Dump flakes: fill `flakes`. Dump vanilla-extract: fill `extract`. Instant dump like mill. Dump/pull all legal until dest full.

Need: `units >= INFUSE_IN` and (`flakes >= INFUSE_FLAKES` or `extract >= INFUSE_EXTRACT`). One reagent, not both. Same `infused: true` either way. At need: `progress += dt × furnaceMul / INFUSE_SECONDS`. At 1: consume `INFUSE_IN` and one reagent — flakes if `flakes >= INFUSE_FLAKES`, else vanilla-extract. Never consume both. Leftover stays, emit the locked good `infused: true` at input quality and `unitSale`. East store else `dropSpot(base)`. Full / no plot → wait at `progress >= 1`.

Flakes and vanilla-extract quality do not enter the output mean.

Intent `{ act: 'infuse'; at }`. Enqueue, no new `Act` letter.

## Overlay

One SVG `overlay-infused.svg`, viewBox `0 0 24 24`. Plus sits flush on the top-right border of that box. Drawn on the existing jam / cask / spirit / oil face when `infused === true`. HUD `itemInner`, drop, recipe yield, Stall row. Not a second file per product. Not a lens. Not Pixi wash. Almanac does not grow a pane per infused good — one Game concepts **Infusion** page — [[ui/almanac]] [[art/items]].

## Stall

Infusable stall goods: `JamId`, `CaskId`, `SpiritKind`, `'oil'`. Stock and worth per variety × `InfusedKey`. `InfusedKey = 'plain' | 'infused'`. `plain` is `infused === false`. Other goods unchanged.

Sell all, per good, sat `S0` at the start of that good:

- Infused clean `V_inf` pays `V_inf × mul(S0, good)`. Does not raise `sat`.
- Plain clean `V` pays the trapezoid from `S0` and raises `sat` by `V / SAT_DEPTH`, clamp 1.

Infused uses `S0`, not post-plain sat. Clearance `$1` still exempt. Contract-bound units still skip `worth` and `sat`. Miss / cancel infused remainders enter infused worth and do not raise `sat`; plain remainders raise `sat` as today.

`Accepts` ignores `infused`. A match is a match.

## Reputation

On complete: `addRep(REP_DONE[stars] × (1 + 0.25 × fraction))`, clamp `[0, REP_MAX]`.

```
fraction = sum(bin.infusedFilled) / sum(bin.demand.amount)
```

`Bin` += `infusedFilled: number`. A unit increments `infusedFilled` iff `Accepts` and the item is jam / cask / spirit / oil with `infused === true`. Fruit, sugar, flour, extract never. `infusedFilled <= filled`. Prize complete uses the same fraction. Miss and cancel do not.

## Furnace bread

`FurnaceRecipe = 'none' | 'ash' | 'bread'`. `Furnace.recipe` required. First accepted dump locks it. Later dumps must match. `units === 0` → `'none'`.

Flour dumps lock `'bread'` and refuse on `'ash'`. Ash feedstock (existing `furnaceValue` table minus flour) locks `'ash'` and refuse on `'bread'`. Mix ash freely among ash feedstock. Variety, quality, `infused` ignored on ash.

Bread: `FURNACE_BREAD_IN` flour → `{ kind: 'bread'; quality: number; count: number; unitSale: number }` `BREAD × qualityMul(mean q)`. Duration `fixed` `FURNACE_SECONDS`. Consume `FURNACE_BREAD_IN` at finish, leftover stays, drop bread east store else `frontOf`.

```
{ kind: 'bread'; quality: number; count: number; unitSale: number }
```

Stall `'bread'`. Not infusable. Not compost. Not furnace. Not flakes. `STACK_MAX_CRAFTED`. `SAT_FLOOR['bread']` with flour. `FEASIBLE_PER_DAY['bread']` furnace rate. `recipesOf('furnace')` ash rows plus one bread `one` flour. Live: empty (`units === 0`) cycles every list row; filling / working / ready pin the locked recipe.

Flour is no longer ash refuse. Infused oil still burns as oil on `'ash'`. Infused spirit still burns as spirit on `'ash'`. Jam / cask / flakes / vanilla-extract / bread / extract refuse.

## Research

`unlock-infusion` trade. `reveal` and `requires` `unlock-preservatives`. `effect` `unlock-sku` `buy-infuser`. Cost / seconds preference. No `unlock-chilli`. `pack-chilli` show + buy `unlock-infusion`. Almanac Ingredients: infuser gate `unlock-infusion`; chilli mill and vanilla mill gate `unlock-grinder`.

## Invariants

`infusion.chilli` — `AnnualId` includes `chilli`. No `unlock-chilli`. `pack-chilli` `PACK_N` at 10, show and buy `unlock-infusion`, `'base'` quality 0. `growSeconds` 190, slower than potato, faster than vanilla. `rotSeconds` longer than potato. One Variety `'base'`. No `better-chilli`.

`infusion.extract` — Vanilla mill `MILL_VANILLA_IN` 1 → `{ kind: 'vanilla-extract' }` count `MILL_VANILLA_OUT` 4. Not `{ kind: 'extract' }`. Grass mill stays stall `'extract'`. Flakes and vanilla-extract are not `StallGoodId`. Illegal: `unitSale` on either.

`infusion.item` — `infused: boolean` required on jam, cask, spirit, oil. Machine output `false`. Infuser output `true`. Oil is infusable. Illegal: optional `infused`. `infused` is in the stack identity key.

`infusion.machine` — Infuser 2×2 `Machine`, `MILL_W` × `MILL_H`, `INFUSE_SECONDS` 90 `fixed`, mill I/O, pads, `inn`. `furnaceMul` applies. Not machinery. Not `work`. Not `machineMul`. Need `INFUSE_IN` good + 1 reagent: `INFUSE_FLAKES` flakes or `INFUSE_EXTRACT` vanilla-extract, not both. Same `infused: true` either way. Output same good, quality and `unitSale` unchanged. Refuses `infused === true`. `MachineId` += `infuser`.

`infusion.overlay` — Infused face is the plain face plus one `overlay-infused.svg`. No per-product infused SVG. Almanac: one Game concepts Infusion page, not a pane per infused good.

`infusion.stall` — Infused clean `V_inf` pays `V_inf × mul(sat, good)` and does not raise `sat`. Plain trapezoid still raises `sat`. Infused samples sat at the start of that good.

`infusion.rep` — Complete: `REP_DONE[stars] × (1 + 0.25 × infusedFilled / amount)`, clamp `[0, REP_MAX]`. Miss and cancel do not.

`infusion.furnace` — Furnace locks `'ash' | 'bread'`. Flour is bread. Ash feedstock is ash. No mix. Bread `{ kind: 'bread' }` is a stall good. Not infusable.

Assumption: if both reagent buffers are full, the batch consumes flakes. Bread is a stall good.
