# VFX

Code: `view/vfx.ts` (the `VFX` table and `vfxReduced`), `view/layers/vfx.ts` (drawing), flow in `view/layers/overlay.ts`, `view/layers/props.ts` and `view/layers/actors.ts`; `World.vfx` and `World.burst` in `world.ts`; see [[code-map]].

## Job

An effect on the map tells the player that something is happening now: a machine is working, a job is in progress, water is moving. Effects are for reading the farm, not decoration; an idle machine draws no effect.

The working bar on a machine is not one of these effects. `view/meter.ts` draws it on the building while `craftState` is `working` ([[features/machines]]).

## Three kinds

| kind | shows | lasts | comes from |
|---|---|---|---|
| state | a building or a job is working now | while the state holds | a state the view reads each frame (`millWorking`, `stillWorking`, a seat's head job …), or `World.vfx` for sprinklers |
| burst | something just finished | one cycle, then removed | `World.burst(id, at)`, drained each frame |
| flow | a system is moving something | while it moves | read live each frame: conducting pipes, wires on 1, the gardener walking, Mill sails, the Pump arm |

State and burst effects are frame animations from `src/assets/vfx/`. Flow is not frames: the Pixi ticker moves, turns or tints a sprite or a line.

## Frames

A `vfx-` file draws its frames as sibling groups `f0` … `fN`; the atlas makes one texture per frame. Exactly one frame is drawn at a time, cut, not blended: interpolating pixel art blurs it. A `VfxDef` has 2, 3, 4, 6 or 8 frames (the `def` signature allows only those; `VFX_FRAMES` in `ids.ts` is the frame index type), rest slots with no frame so a cycle can pause (`slots`), the cycle length in seconds (`dur`), its size, and its anchor: `vertex` centres it on a tile corner (sprinklers, exhaust), `cell` puts its origin at the tile's corner.

All instances of a state effect share one phase. A burst runs its frames once and fades over its last 30%.

## The effects

| id | kind | shown when |
|---|---|---|
| `sprinkler-spray`, `sprinkler-spray-large`, `sprinkler-spray-vert` | state | the sprinkler poured this step ([[features/water]]) |
| `dust` | state | a Mill or jam machine is working |
| `steam` | state | a Pot still is working |
| `brew`, `age` | state | a Barrel is working: `brew` before `BARREL_MATURE`, `age` after; never both |
| `grind` | state | a Grinder is working |
| `station`, `station-lights` | state | a Crop Variety Station is working: `station` on the screen in the west tile; `station-lights` on the three lights in the east tile, two green and one blue, the blue stepping west to east with a dimmer step between lights, six frames (`stationStateVfx`) |
| `compost` | state | a Compost box is working (`compostWorking`): brown particles rise from the lid into the tile north of the box and fade, six frames, drawn from that north tile at 24 × 48 (`compostStateVfx`) |
| `furnace`, `furnace-smoke` | state | a Furnace is working: fire at the opening in the south tile, smoke from the chimney in the north tile |
| `exhaust` | state | a Tractor moves at `SMOKE_SPEED` or faster, drawn behind it; Quads do not smoke |
| `dig` | state | a gardener's head job is `shovel` with work left |
| `graft` | state | a gardener's head job is `graft` with work left |
| `pour` | burst | a **Water** job finished |
| `pour-green` | burst | a **Spray** or **Pour extract** job finished: the `pour` frames with the liquid in `leaf` green instead of `water` blue |
| `tend` | burst | a **Tend** job finished |
| `burrow-pop` | burst | a burrow is dug out |

While digging, the tilled-soil texture also grows from the centre of the tile as a square of side `TILE` × progress, under the gardener, until the tile really becomes a plot.

Flow: water dashes march along conducting pipes away from the sources and stop at a closed valve, beads run along a wire that carries 1, both on the `FLOW_DASH` cycle; the gardener bobs by `WALK_BOB` while walking; the Mill's `sails` group turns while it works; the Pump's arm (`pump-arm`) lifts while a gardener fills a bucket at it.

## Sprays

A spray does not sweep: four frames cannot turn an arc without flicker. Droplets sit on fixed rays and each frame moves them one step outward, so the spray reads as moving while its shape stays still. Its reach is the sprinkler's real area (`aoe`). `vfx-spray-large` is drawn at its own size, not `vfx-spray` scaled, because scaling doubles the pixel grid. The vertical spray is drawn east-west and rotated for north-south.

## Reduced motion

With **Reduced motion** on, or the system's reduced-motion setting ([[menu]]), `vfxReduced()` is true, read on every call: state effects show frame 0 and do not animate, bursts are not shown, flow shows its first position. Nothing is saved.

## Outside the map

The Almanac's machine cards play a machine's working effects over its art ([[features/almanac]]). There the frames are SVG from `atlasHtml`, each in a `vfx-frame` group whose CSS animation `vfx-cut-{slots}` shows it for one slot of the cycle; `src/index.css` holds those keyframes for 2, 4, 6 and 8 slots. Reduced motion shows frame 0 there too.

## Rules

- A state effect is drawn only while its state is true; an idle machine has no sprite.
- A burst is pushed at the outcome in simulation code, from `finishWork` or beside it, never from a watcher.
- `World.bursts` and `World.vfx` are not saved, not in the multiplayer snapshot and not in the digest; each player's game makes its own.
- Every effect has an HTML marker `data-vfx={id}` for tests while it is drawn; it never takes a click.

## When you change this

- A new effect: a `vfx-{id}.svg` with frame groups, an entry in `VFX`, its `VfxId`, its file and frame count in `atlas.ts`, its file in `VFX_FILE` and a pair in `PAIRS` for `#atlas` (`atlas-view.tsx`), and the condition in `layers/vfx.ts` or a `World.burst` at the outcome.
- A machine's working effect: also its `MACHINE_LOOK` in the Almanac, and a `vfx-cut-{slots}` keyframe if no effect has used that slot count before.
- A machine's working state: the same `*Working` function drives the effect and the machine's sound cue ([[systems/sound]]).

## Decisions

- Digging is a state effect, not a burst: a burst plays on ground that is already dug and says "done", while the player needs to see "digging".
- The sprinkler spray comes from the water step that actually poured, not from a sprinkler's rate: a network with no water shows no spray.
