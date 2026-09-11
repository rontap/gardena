# Infusion

Infuser, chilli, flakes, vanilla-extract, infused goods. Stall [[mechanics/market]] [[mechanics/saturation]]. Board [[mechanics/contracts]]. Mill / furnace [[mechanics/machines]]. Crop [[mechanics/plants]]. Size [[items/buildings]]. Place [[ui/place]]. Look [[ui/machines]]. Numbers preference unless marked.

Illegal: `ResearchId` `unlock-chilli`. Illegal: optional `infused`. Illegal: `{ kind: 'extract' }` from vanilla mill. Illegal: flakes or vanilla-extract as `StallGoodId`.

## Chilli

`AnnualId` includes `chilli`. Class fruit. `VARIETIES.chilli` `['base']` only. No named Variety. No `better-chilli`. `CROPS.chilli.growSeconds` preference, slower than potato, faster than vanilla. `CROPS.chilli.rotSeconds` preference, longer than potato. `pack-chilli` is `PACK_N` seeds, `'base'` quality 0. Show and buy `unlock-infusion`. No chilli research row. Ripe chilli harvests as fruit. Mill for flakes. Fruit is a stall good. Flakes are not.

## Vanilla-extract

Mill recipe `'vanilla'`: `MILL_VANILLA_IN` fruit → `{ kind: 'vanilla-extract'; quality; count: MILL_VANILLA_OUT }`. `unitSale` none. Quality is the mean of what went in. Not the grass mill stall good. `millProductName('vanilla')` is vanilla extract. Grass mill stays `{ kind: 'extract' }` count 1, `EXTRACT`, quality 0, stall `'extract'`. Illegal: `unitSale` on vanilla-extract. Illegal: vanilla mill `{ kind: 'extract' }`. Not stall. Not compost. Not furnace. Not grind. Infuser input.

## Flakes

Mill recipe `'chilli'`: `MILL_CHILLI_IN` fruit → `{ kind: 'flakes'; quality; count: MILL_CHILLI_OUT }`. Quality is the mean of what went in. `millProductName('chilli')` is flakes. Illegal: `unitSale` on flakes. Not stall. Not compost. Not furnace. Not grind. Infuser input.

## Infused

Required boolean on jam, cask, spirit, and oil. Machine output `false`. Infuser output `true`. Illegal: optional `infused`. Illegal: `infused` on fruit, sugar, flour, extract, flakes, vanilla-extract, bread, spirit omitted. Oil is infusable. `infused` is in the stack identity key. Infused never merges with plain. Same keys otherwise — [[mechanics/inventory]] `inventory.stack`. Infuser refuses `infused === true`. `unitSale` and quality do not change at the Infuser. The flag is the difference. Stall and reputation read it. Face is the plain good plus `overlay-infused.svg` — [[architecture/view]] `view.infused-overlay`. No second product pane.

## Infuser

2×2 `Machine`, mill I/O, pads two cells wide. Tick origin. Guest shop + place + delete + dump. `dest(infuser)` = `at`. Show `unlock-preservatives`, buy `unlock-infusion`. `inn: Signal`. Port `in` origin top. Pads `'both'`. Unwired 0 ticks. `inn === 1` skip tick. Dump and Unload still fill. Not machinery. Not `machineMul`. `furnaceMul` multiplies progress. Catalog `clockText` stays nominal.

Empty: `lock: 'none'`. First accepted good dump locks `Infusable`. Later goods must match. `units === 0` → `'none'`. Oil has no variety. Mixed spirit has no variety. `INFUSE_IN` `INFUSE_FLAKES` `INFUSE_EXTRACT`. `INFUSE_SECONDS` preference, `fixed`. Dump good: jam / cask / spirit / oil, `infused === false`. Refuse infused, fruit, sugar, flour, extract, bread, flakes-as-good, vanilla-extract-as-good, seeds, tools. Dump flakes: fill `flakes`. Dump vanilla-extract: fill `extract`. Need: `units >= INFUSE_IN` and (`flakes >= INFUSE_FLAKES` or `extract >= INFUSE_EXTRACT`). One reagent, not both. Same `infused: true` either way. If both reagent buffers are full, the batch consumes flakes. At 1: consume `INFUSE_IN` and one reagent — flakes if `flakes >= INFUSE_FLAKES`, else vanilla-extract. Never consume both. Leftover stays, emit the locked good `infused: true` at input quality and `unitSale`. East store else `dropSpot(base)`. Full / no plot → wait at `progress >= 1`. Flakes and vanilla-extract quality do not enter the output mean. Intent `{ act: 'infuse'; at }`.

## Overlay

One SVG `overlay-infused.svg`. Drawn on the existing jam / cask / spirit / oil face when `infused === true`. HUD `itemInner`, drop, recipe yield, Stall row. Not a second file per product. Not a lens. Not Pixi wash. Almanac does not grow a pane per infused good — one Game concepts **Infusion** page — [[ui/almanac]] [[art/items]].

## Stall

Infusable stall goods: `JamId`, `CaskId`, `SpiritKind`, `'oil'`. Stock and worth per variety × `InfusedKey`. `InfusedKey = 'plain' | 'infused'`. Sell all, per good, sat `S0` at the start of that good: infused clean `V_inf` pays `V_inf × mul(S0, good)` and does not raise `sat`; plain clean `V` pays the trapezoid from `S0` and raises `sat`. Infused uses `S0`, not post-plain sat. Clearance `$1` still exempt. Contract-bound units still skip `worth` and `sat`. Miss / cancel infused remainders enter infused worth and do not raise `sat`. `Accepts` ignores `infused`.

## Reputation

On complete: `addRep(REP_DONE[stars] × (1 + 0.25 × fraction))`, clamp `[0, REP_MAX]`. `fraction = sum(bin.infusedFilled) / sum(bin.demand.amount)`. A unit increments `infusedFilled` iff `Accepts` and the item is jam / cask / spirit / oil with `infused === true`. `infusedFilled <= filled`. Prize complete uses the same fraction. Miss and cancel do not. — [[mechanics/contracts]] `contracts.infused`

## Furnace bread

Furnace locks `'ash' | 'bread'`. Flour dumps lock `'bread'`. Ash feedstock locks `'ash'`. Mix ash freely among ash feedstock. Variety, quality, `infused` ignored on ash. Bread: `FURNACE_BREAD_IN` flour → `{ kind: 'bread' }` `BREAD × qualityMul(mean q)`. Stall `'bread'`. Not infusable. Not compost. Not furnace. `STACK_MAX_CRAFTED`. Infused oil still burns as oil on `'ash'`. Infused spirit still burns as spirit on `'ash'`. Jam / cask / flakes / vanilla-extract / bread / extract refuse. — [[mechanics/machines]] `machines.furnace-lock`

## Research

`unlock-infusion` trade. `reveal` and `requires` `unlock-preservatives`. `effect` `unlock-sku` `buy-infuser`. Cost / seconds preference. No `unlock-chilli`. `pack-chilli` show + buy `unlock-infusion`. Almanac Ingredients: infuser gate `unlock-infusion`; chilli mill and vanilla mill gate `unlock-grinder`. — [[mechanics/research]] `research.infusion`

## Invariants

`infusion.chilli` — `AnnualId` includes `chilli`; no `unlock-chilli`; `pack-chilli` show and buy `unlock-infusion`, `'base'` quality 0; `growSeconds` slower than potato, faster than vanilla; `rotSeconds` longer than potato; one Variety `'base'`; no `better-chilli`.

`infusion.extract` — Vanilla mill `MILL_VANILLA_IN` → `{ kind: 'vanilla-extract' }` count `MILL_VANILLA_OUT`; not `{ kind: 'extract' }`; grass mill stays stall `'extract'`; flakes and vanilla-extract are not `StallGoodId`; illegal: `unitSale` on either.

`infusion.item` — `infused: boolean` required on jam, cask, spirit, oil; machine output `false`; infuser output `true`; oil is infusable; illegal: optional `infused`; `infused` is in the stack identity key.

`infusion.machine` — Infuser 2×2 `Machine`, mill I/O, pads, `inn`, `INFUSE_SECONDS` `fixed`; `furnaceMul` applies; not machinery, not `work`, not `machineMul`; need `INFUSE_IN` good + 1 reagent (flakes or vanilla-extract, not both); if both buffers are full, the batch consumes flakes; same `infused: true` either way; output same good, quality and `unitSale` unchanged; refuses `infused === true`.

`infusion.overlay` — Infused face is the plain face plus one `overlay-infused.svg`; no per-product infused SVG; Almanac: one Game concepts Infusion page, not a pane per infused good.

`infusion.stall` — Infused clean `V_inf` pays `V_inf × mul(sat, good)` and does not raise `sat`; plain trapezoid still raises `sat`; infused samples sat at the start of that good.

`infusion.rep` — Complete: `REP_DONE[stars] × (1 + 0.25 × infusedFilled / amount)`, clamp `[0, REP_MAX]`; miss and cancel do not.

`infusion.furnace` — Furnace locks `'ash' | 'bread'`; flour is bread; ash feedstock is ash; no mix; bread `{ kind: 'bread' }` is a stall good; not infusable.
