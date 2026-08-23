# 0.10 Early Access 2 — Plant diseases

Design notes for the disease update. **Not rules yet.** Every number here is a proposal; nothing is locked.

Source draft: [[Path to V1.0 - readonly]] §0.10. This note is the critique of that draft and the redesign that came out of it.

Reads: [[mechanics/plants]] [[mechanics/soil]] [[mechanics/rng]] [[mechanics/research]] [[mechanics/market]] [[mechanics/family]] [[ui/lens]] [[aims]]

---

## Design goals

In priority order. Every mechanic below is judged against these.

1. **Dissuade monoculture.** A full field of one heirloom cultivar should be an earned endgame, not the obvious opening.
2. **Dissuade carrot-spam.** A single wide continuous block should be dangerous. Outbreaks should force digging plants out — on-edge, not merely expensive.
3. **Make bio vs mechanised a live choice.** Not a new axis — a second pressure on the compost/synthetic axis the game already has.
4. **Spend the player's attention, not their money.** Attention is the scarce resource. Compost is free and still an early-game item because it costs time. Disease must be priced the same way.

---

## What the draft got wrong

Kept here so the same mistakes do not come back.

### Money penalties cannot dissuade carrot-spam

A carrot field absorbs 50% losses and still profits (`CROPS.carrot.sale` 3, `growSeconds` 90). Any disease that costs **money** is a rounding error at the low end and a nuisance at the high end. Only a penalty paid in **work** — shovel swings, walking, replanting — scales with farm size.

### The bio/spray tension does not exist at current numbers

Player skill `bio` is `maxTier` 5 × `mul` 1.03 — **+15% maximum**, crop fruit only, applied at `marketGain` ([[mechanics/market]]). Pesticide at $70 / 40 uses is **$1.75 a plant**. Bio never binds in either direction.

The real bio cost is not the sale multiplier — it is **compost**: free fertiliser that costs half a day of box time and a walk per unit ([[items/fertilizer]], [[mechanics/soil]]). Synthetic is instant, bought, no building, no hauling. That is already an attention-vs-money axis and it is the best axis in the game.

Also unresolved in the draft: `bio` restores when one `feed` lands ≥ `BIO_RESTORE` ([[mechanics/soil]]). If spraying only sets `bio = false`, the next fertiliser bag erases the penalty. Spraying must mark the **plant instance** permanently.

### Antifungal extract is strictly dominant

$15 / 20 uses = $0.75 a plant, +25–30% immunity (the draft says both), plus total negation of Gray Mold — which is the only disease the emergent-overwater roll produces. Always-buy, no decision.

It becomes a refiner-mill product in [[Path to V1.0 - readonly]] §0.12 (grass 15× → extract). Its cost should be mill throughput, not dollars.

### The spread rate is an extinction event

33% × (1 − 0.15) = 28% per uninfected neighbour per checkpoint, 8 neighbours, 4 checkpoints. A neighbour escapes one infected plant with probability 0.72⁴ ≈ **27%** — ~73% transmission per adjacent plant per lifetime, and each new infection starts its own four checkpoints. Deadly variants at 50%: 0.575⁴ ≈ 11% escape, **89% transmission**. A planted bed saturates in a day or two of `DAY_SECONDS`.

### It punishes density, not monoculture

Common spread in the draft is **species-agnostic**. A checkerboard of six crops spreads exactly as fast as a solid carrot block. Goal 1 is served by nothing in the draft except the deadly variant, which is the least developed part of it.

### Maturity checkpoints are the wrong clock

- Growth speed varies (`STUNT` 0.67, `growSpeed` mods, `RARITY_GROW`) and disease itself reduces it — so a stunted plant rolls the same four times over a longer window, making slow high-value crops **less** infectious per real second. Backwards.
- Undefined whether ripe plants spread. Ripe sits for `rotSeconds` (potato 600s = 2.5 days).
- Trees have no maturity ramp. [[Path to V1.0 - readonly]] §0.11 already flags this as unsolved.

### Smaller defects

| Defect | Note |
|---|---|
| Mildew ≡ Anthracnose | Identical effects (−20% growth, less happy). One is a reskin. Differentiate the attack surface or ship two commons. |
| Freshness penalties are cosmetic | `freshMul(f) = f >= 0.8 ? 1 : f / 0.8` ([[mechanics/plants]]). Gray Mold −20% lands at exactly 0.8 — **full price**. Deadly −25% is a ~6% haircut. |
| Rarity immunity does not price the risk | 15 points of immunity against a 3.5× `RARITY_SALE` plus heirloom skill. And `TOL_RARITY` 0.65 already makes heirlooms fragile — this is a second fragility axis on the same crops. |
| "Less happy" is not expressible | Happiness is a drain **rate** (`HAPPY_WILT_SECONDS` etc.). Needs a `HAPPY_SICK_SECONDS` and a rule on whether sickness blocks the gain band. |
| Additive stacking has no clamp | Three commons = −50% growth on top of `STUNT` (or `STUNT²`). Say whether it multiplies with stunt; floor it. |
| Two different "20s" | "20 seeds planted" (research gate) vs "first 20 seeds bought" (infection grace). Collapse to one counter or neither can be explained. |
| Naming drift | immunity / resistance / `extra_immunity` / `immunized` / `is_bio`. Pick one word, camelCase it — codebase is `waterUsePerSec`, `saleMul`, `growSpeed`. |
| Wild berry / apple exemption | Apple is a `Tree`, no `Plant` — exempt for free. There is no berry ([[mechanics/plants]] ends "No shrub. No berry."). Drop the line. |
| Lens is binary | Every other lens has three swatches ([[ui/lens]]). Give it healthy / infected / terminal, and decide its family-skill gate. |

Worth stating rather than leaving to fall out: happiness feeds `rollGrowRarity`, so disease already silently suppresses rarity upgrades.

---

## Redesign

Five changes. Each aimed at a numbered goal.

### 1. Soil inoculum — the anti-monoculture mechanic (goals 1, 2)

Infection persists in the **plot**, not only the plant. `Soil` already carries water / fert / bio; add an inoculum level.

- An infected plant raises its plot's inoculum.
- Sowing rolls against the plot's inoculum, not against a timer.
- Inoculum decays fast when a different `CropClass` is sown (`root` / `grain` / `fruit` already exist in `defs/crops.ts`), and barely at all when the same one is re-sown.

What this buys:

- **Carrot-spam compounds against itself.** Cycle 1 on fresh plots is clean; cycle 6 on the same plots is a plague. The pressure grows with the behaviour being discouraged.
- **Crop rotation is the counterplay.** Costs planning and attention, not money. Cannot be sprayed away. Real-world correct.
- **Fast crops cannot outrun it.** Carrot is 90s = 0.375 days; under any per-day tick a carrot harvests before disease can touch it. Rolling at sow closes that hole.
- **It survives automation.** A truck-and-sprinkler farm still has to rotate — this stays relevant through §0.14+.
- **The heirloom mono-field stays reachable**, gated behind genetic-resistance research plus rotation discipline plus extract upkeep. That is the arc: earned husbandry, not a default.

Cheaper fallback if inoculum is too much for one update: scale infection chance by **same-species neighbour count**. A plant with 8 of its own kind around it is a torch; one with 3 is nearly safe. One number, legible, and it reads as a gradient in the lens over a big single-crop block.

### 2. One disease tick a day, at the seam (goals 2, 4)

Replace the 25/50/75/100 checkpoints with a single tick at the day seam, before the field tick, alongside stipend and tax ([[mechanics/day]]).

Solves in one move: trees (§0.11's open problem), stunted plants, ripe plants, and determinism — `at(col, row, day)` matches the existing `tree` and `grow` streams ([[mechanics/rng]]).

The real payoff is **legibility**. An outbreak that advances one row a day reads as a *front* crossing the field. Maturity checkpoints fire at scattered per-plant times and read as noise. The recap already stops the player once a day — *"3 plants fell ill"* lands exactly where they are thinking.

Fast crops are covered by the sow-time soil roll, so a daily tick does not let them escape.

### 3. Terminal infection — pay in shovel swings (goals 2, 4)

Infection carries a **severity** that accumulates while untreated, not a binary status.

Past a threshold the plant is **terminal**: pesticide no longer works, only the shovel — and a terminal plant is the strongest spreader in the field. The forced response becomes 40 shovel swings at `SHOVELS.shovel.workSeconds` 1.2 plus walking plus lost seed. Priced in the only currency that scales.

Fits existing vocabulary: `dead` / `rotten` already shovel to empty and drop nothing ([[mechanics/plants]]). Dug-out plants feed the compost box (dead plant 1, rotten fruit 2) — quarantine losses repay the bio player in the currency they are already spending.

### 4. Extract buys **time**, not immunity (goals 3, 4)

Antifungal extract stops adding a flat immunity percentage. Its job is to **slow severity accumulation** — it buys the days you need to notice and react.

That turns an always-buy into a real decision (pre-treat this field, or trust myself to check on it?) and keeps it relevant at every farm size. Immunity percentages stop mattering as the farm grows; time never does.

### 5. Put spraying on the compost axis (goal 3)

Not a new axis. The same one:

| | Cost | Speed |
|---|---|---|
| compost / bio | attention — box time, hauling | slow |
| synthetic / spray | money, forfeits the premium | instant |

Pesticide's real cost should be **falling out of the compost economy** the player spent five days of skill points building — not $70, which is noise by mid-game. And spraying must mark the plant instance permanently, or `BIO_RESTORE` erases it on the next bag.

For this to bind, the bio premium has to be worth more than a bottle cap — either a much larger multiplier or a hard gate (a bio-only stall or contract that refuses sprayed fruit). Tuning call, but the current +15% ceiling cannot carry a decision axis.

---

## Tuning by R₀, not by feel

Do not hand-tune 33% and 50%. Pick a target reproduction number per disease and solve for the roll.

| Disease class | Target | Reads as |
|---|---|---|
| the three commons | R₀ ≈ 1 | endemic, ambient, annoying, never field-ending |
| species-specific deadly | R₀ > 1 on monoculture, < 1 on mixed | **this asymmetry is the anti-monoculture mechanic** |

That second row is the whole design expressed as one tunable. The daily tick and the lens make the result observable enough to tune by watching rather than by algebra.

---

## Open questions

- **The automation gap.** Hand-spraying is fine as a manual phase — the Factorio parallel is biters, an attack you must answer that pushes you toward turrets. But the automation that answers it (trucks, treated sprinklers) is §0.14+. That is a long stretch of one repeated non-progress action. Ship a proto-automation in EA2 — a sprinkler carrying treatment would be nearly free given the smart-sprinkler dial already exists — or consciously accept the gap?
- **Can trees be infected in EA2?** §0.11 defers it. A permanently sick apple tree is a better persistent threat than another annual status, and the daily tick makes it implementable now.
- **Does composting infected material carry inoculum?** Realistic (hot composting kills it) but probably one rule too many.
- **Spread resolution order.** Must resolve against a snapshot of who was infected at tick start, or results depend on plot iteration order.
- **Application shape.** Per-plant hand item with an apply intent (like `tend` — legality, work seconds, prompt, pulse), or area? Per-plant is the attention cost by design; confirm that is intent and not accident.

---

## Carried from the draft, unchanged

- Three commons (after differentiating two of them) plus one species-specific deadly variant per crop. Deadly spreads **within** species.
- Statuses on the plant, an SVG effect on the soil, a lens.
- Research gate behind first-N-seeds, using the existing gate pattern (`digs` / `mines` in `World`, `gateProgress`) — [[mechanics/research]].
- Disease resistance row in the almanac, per rarity, as a `Stat` row beside the tolerances — [[ui/almanac]].
- Research: disease resistance I–III, then heirloom genetic resistance.
- Emergent disease tied to the existing water bands. Rain / heat hooks land in §0.13.
- Debug left menu behind unlock-all.

---

## Out of scope

- Weather (§0.13). Only the hooks.
- Refiner mill and the extract recipe (§0.12).
- Trucks and treated sprinklers (§0.14+) — see the open question.
- Re-tuning the whole crop economy. Disease exposes that the bio premium is too small; fixing bio's ceiling is a separate call.

---

## Not yet locked

Nothing here is locked. It goes to spec once the open questions are answered — especially the inoculum-vs-neighbour-count call, which decides how much of `Soil` and `save` this update touches.
