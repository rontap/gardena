# New mechanics

Standard. How a mechanic is added so the next reader finds it without opening `world.ts`. [[canon]] is coding law; this note is where a mechanic's parts go and why. Module map: [[architecture/modules]].

## The test

An agent sent at the price of carrots opens `defs/crops.ts` and `sim/modifiers.ts`. Two files. It never opens `world.ts`, and it does not need to know that plants exist in chunks, that stalls have bins, or that a tractor can harvest.

Measured on the code as it stands:

| task | files to edit | files to read | `world.ts` |
|---|---|---|---|
| retune carrot sale | 1 — `CROPS.carrot.sale` | 1 — `apply()` in `modifiers.ts`, 52 lines | no |
| add the research station | 33 | all of them | yes |

The first number is what layering buys. The second is what a mechanic costs when it is threaded by hand through every seam. Aim each new mechanic at the first.

## Four layers

Push each rule down until it cannot go lower. A rule one layer too high is invisible to the reader who needs it.

| layer | holds | may import |
|---|---|---|
| `defs/` | tables, constants, every number | other defs |
| `sim/<thing>.ts` — the class | the thing's own state, and the rules that need only itself | defs |
| `sim/feature-<x>/` — free functions `(w: World, …)` | rules that need more than one cell | defs, sim classes |
| `world.ts` | tick order, indexes, seats, `cell` / `setCell` / `track` | everything |

`world.ts` is a coordinator. A mechanic that lives there is a mechanic nobody will find.

`Plant` is the small model: it owns `maturity`, `happiness`, `variety`, `quality`, and `stats()` — the one rule that needs only a plant. Growth, which needs soil and weather, is a free function in `feature-field/`. Nothing about plants is on `World`.

## Before the first line

Answer four questions in the mechanic's note, not in code.

1. **What holds the state?** A class in `sim/`. Not a `World.<thing>s` field, not a `Map` on `World` keyed by coordinate. `World` may index instances it does not own — that is `track()` — but the instance is the owner.
2. **Where is the number?** `defs/`. Tagged preference, tuned-to, or derived — [[standards/docs]]. A number in `sim/` is a number the balancer cannot find.
3. **Who else asks about it?** A field on the class. Never a list of kinds at the call site — see **Asking**.
4. **When does it change?** Its own method. Never a new arm in an existing ladder — see **Changing**.

## Asking

A caller that needs to know *what kind of thing* this is has already lost. It should ask *what this thing can do*.

```
c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still' || c.kind === 'furnace'
```

is wrong not because it is long, but because a new machine is silently absent from it, and nothing fails. The reader of `overlay.ts` cannot tell whether the omission is a rule or a mistake.

`BaseBuilding` carries the capability fields. Each is readonly with a default; a subclass that wants the default declares nothing.

| field | question |
|---|---|
| `ports` | which wire ports it has |
| `pads` | can a vehicle load or unload here |
| `takeAll` | does a dump hand over the whole item |
| `accept` / `apply` | what will it take, and what happens when it does |

Add a field when a second call site asks the same question. Name it for the question, not for the set that answers it today: `hasted`, not `isMillLike`.

The payoff is the shape the user of the class never writes:

```ts
class Cooler extends Machine {
  readonly kind = 'cooler' as const
  override readonly ports = ['in'] as const
}
```

That class is already solid, already indexed, already a valid vehicle pad, already carries a wire port, already refuses items it has no `accept` for. Nothing else in `src/` mentions it.

Current chains and the cut that removes them: [[plans/2.4.1-dispatch]].

## Changing

State changes in one of three places, in this order of preference.

| change | lives on |
|---|---|
| needs only this thing | a method on the class — `tick`, `accept`, `stats` |
| needs this thing and its neighbours | a free function in its `feature-` folder, taking `(w, …)` |
| needs the tick order itself | `world.ts`, and only the call |

A ladder over kind inside a tick loop means every machine's rate is written somewhere none of them can see. Each machine owns its own rate.

## Interplay

Mechanics meet through a funnel, never by importing each other.

**`Modifier`** is the working example. `statsOf(crop, variety, quality, mods)` folds a flat list; skills push into it from `family.ts`; the type already admits `research` and `fertilizer`. Adding either changes nothing in `statsOf` and nothing in any consumer — the fold is already written. That is what a good seam looks like: a new contributor is one `push`, and a new consumer is one `reduce`.

**Capability fields** are the second funnel. Fertilizer does not know about the furnace; both answer `pads`.

**Signals** are the third. A sensor does not know what it is wired to; it reads `ports` — [[mechanics/sensors]].

When a new mechanic needs to influence an old one, look for the funnel first. Build a new one only when the note can say what it folds and who may contribute. Two mechanics importing each other is the failure this section exists to prevent.

## Wiring a new machine

The honest seam list, taken from the newest one. Split by whether the seam is real.

**Irreducible — the machine must name itself here.**

| file | why |
|---|---|
| `sim/ids.ts` | the id |
| `sim/building.ts` | the class |
| `defs/shelf.ts`, `defs/research.ts`, `defs/catalog.ts` | SKU, gate, almanac entry |
| `defs/items.ts` | its numbers |
| `sim/feature-machines/recipe.ts`, `recipe.h.ts` | its recipe rows |
| `sim/feature-machines/machines.helpers.ts` | `canX` / `doX` |
| `sim/feature-save/save.h.ts`, `save.ts`, `save.parse.ts` | the wire shape |
| `sim/look.ts`, `sim/prompt.ts` | player copy — the i18n boundary, [[architecture/i18n]] |
| `view/svgs.ts`, `view/layers/props.ts` | art — `sim` never imports `view` |
| `ui/<name>.tsx`, `ui/panel.ts`, `App.tsx` | its panel, if it has one |

**Should be a field, not a mention.** Every file here names the machine only to answer a question a capability field already answers or should.

`sim/plot.ts` · `sim/world.ts` · `sim/nets.ts` · `sim/sensor.ts` · `sim/mp.ts` · `view/hit.ts` · `view/layers/overlay.ts` · `feature-vehicles/vehicle.ts` · `feature-machines/machine.ts` · `feature-place/place.helpers.ts`

Ten of the thirty-three. If your mechanic adds a line to any of them, ask which question is being asked and put it on the class.

## Rules

- No new arm in an existing `kind ===` ladder. Add a field, or a method.
- No number outside `defs/`.
- No mechanic state on `World`. `World` may index; it does not own.
- No mechanic in `world.ts`. New mechanic → new `sim/<name>.ts` — [[architecture/modules]].
- Player copy stays in `look.ts` / `prompt.ts` / `ui`. Art stays in `view`. A sim class holds neither.
- No `sim/index.ts`. Import the module, not a barrel.
- Every mechanic gets a note in `docs/mechanics/`, linked from [[mechanics/_index]], with named invariants and its ids in that note's table.
- Tests are named for the invariant they defend, one `describe` per id — [[standards/testing]].

## Invariants

`mechanics.locality` — Retuning a mechanic's numbers touches `defs/` and reads at most the one function that folds them. `world.ts` is not in that path.

`mechanics.ownership` — A mechanic's state lives on its own class. `World` holds indexes and tick order only.

`mechanics.capability` — A call site asks what a thing can do, never what kind it is. A new subclass that wants the default behaviour adds no line anywhere outside its own file and its defs.

`mechanics.funnel` — Two mechanics influence each other through a declared fold, not by importing each other. The note names what is folded and who may contribute.
