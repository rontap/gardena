# Machine mill pattern

Feature. Graduates into [[mechanics/machines]], [[mechanics/vehicles]], [[ui/machines]], [[ui/sensors]]. Copy: [[standards/user-facing-text]]. Field silo pads: [[plans/next-vehicle]].

A Mill, Jam machine, Pot still, Infuser, and Seed Variety Station share one pattern: a chest on the left feeds the hopper; a chest on the right takes what comes out; a Quad or Tractor Load / Unload on the north / south pads; a wire on `in` pauses the tick (`inn === 1`). Output with nowhere to go waits (`ready`).

The Seed grinder is short of that pattern. The Compost box is short of the wire. The Furnace already extends `Machine` — this update names the tests so the 1×2 footprint matches the Mill, and fixes it if Load / Unload or the origin-row chest does not.

**The barrel is not automatable.** Collect into hand. No pads. No chest on the left or right. No `inn`. Age is not `progress`. Do not add them.

## Live

| building | `inn` | pads | west chest feeds | east chest takes | vehicle Load / Unload |
|---|---|---|---|---|---|
| Mill, Jam machine, Pot still, Infuser, Station | yes | both | yes | yes | yes |
| Furnace | yes (`in` + `out`) | both | origin row only | origin row only | type says yes; 1×2 takeup is south of the south cell |
| Compost box | no | both | yes | yes | yes |
| Seed grinder | no | none | yes | yes (emit) | no |
| Barrel | no | none | no | no | no |

`IoCell` (west chest) includes the grinder. `PadCell` does not. `padBuildings` walks `w.machines` and keeps `pads === 'both'`. Grinder ticks and is hasted; it is not a `Machine`.

Furnace `out` is on when `units === 0`. Dump and Unload still fill while `inn === 1`. South cell has no port.

## New

**Seed grinder** becomes the Mill pattern on 1×1: `inn`, pads `'both'`, ports `['in']` origin top. Tick skips when `inn === 1`. Dump and west-chest feed still fill. East chest already takes emit. Vehicle Load / Unload on the pads. Look: **Paused by wire** when `inn === 1` and the hopper is not empty. Unwired `inn` 0, enabled.

**Compost box** gains `inn` and port `in` origin top. Tick skips when `inn === 1`. Pads already both. Look: **Paused by wire** same rule.

**Furnace** — no shape change if the 1×2 already Load / Unloads and the origin-row chest already feeds and takes. Tests: seated Load on south-of-south; Unload on north of origin; west chest of origin feeds ash and bread lock; east chest of origin takes ash and bread; south cell is not a chest neighbour; `inn === 1` skips tick, dump still fills; `out` follows `units === 0`. Failures in those tests are bugs in this update.

Blue chute west, green chute east: paint on the grinder once it has pads. Compost already. Furnace origin row only, already.

## Not this update

Barrel. Field silos — [[plans/next-vehicle]]. Hopper caps on Mill / Jam / Infuser. Named specialty alcohols. Guest permissions.
