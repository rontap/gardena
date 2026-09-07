# Fenced area

Closed rings of [[items/tiles]] wooden fence. Sensors on those fences watch the interior — [[mechanics/sensors]]. Not Save. Not a `Cell`. Not a `Cover`.

Owner: `sim/feature-enclosure/`. Types `enclosure.h.ts`, rebuild/lookup `(w, …)` in `enclosure.ts`. `World` indexes; it does not own. Rebuild on fence add, fence remove, and `indexAll`. Never on tick. Eval and hover do not rebuild.

Fence sits in the middle of a cell (`World.fences`). `hasFence` is a wall. Buildings and sensors without a fence do not block.

## Types

```
EnclosureId = number

Enclosure = {
  id: EnclosureId
  interior: Coord[]
  fences: Coord[]
}
```

| field | is |
|---|---|
| `interior` | one 8-connected component of owned **non-fence** cells that cannot 8-reach unowned land or off-map |
| `fences` | fence cells Chebyshev-1 from that interior (corner posts of a 1-cell hole count) |

Map edge and unowned land are **outside**, not a wall. A ring must close with fences. Outside flood is **8-connected**: a diagonal gap leaks.

## Indexes

Filled by the feature, not by `track()`. Not a field on `Plot` (`setCell` would drop it).

| map | key | value |
|---|---|---|
| `World.enclosures` | `EnclosureId` | `Enclosure` |
| `World.fenceEnclosures` | `"col,row"` | `EnclosureId[]` |
| `World.plotEnclosures` | `"col,row"` | `EnclosureId[]` |

A plot may sit in many interiors. A fence may sit in many `fences` lists.

Eval / hover for a fenceable sensor on a fence: `fenceEnclosures.get(key)` → concat those interiors → unique coords. O(watched cells). No flood.

## Close vs leak

```
CLOSED (1-cell interior)     OPEN (south leak)        DIAGONAL leaks
F F F                        F F F                    F F .
F . F                        F . F                    F . F
F F F                        F . F                    . F F
                             F   F
```

## Grid — one fence, many fenced areas

```
F F F F F
F A F B F
F F F F F
F C F D F
F F F F F
```

Center `F` is Chebyshev-1 from A, B, C, D → `fenceEnclosures` holds four ids. A room-corner `F` watches that room only.

## Nested

```
F F F F F F F        D = donut interior, H = hole interior
F D D D D D F
F D F F F D F
F D F H F D F
F D F F F D F
F D D D D D F
F F F F F F F
```

Outer-ring `F`: adjacent to D only → range D. Inner-ring `F`: adjacent to D and H → range D∪H. A hole plot is in `plotEnclosures` via membership of interiors. The sensor uses **fence adjacency**, not a second walk.

## Sensor on a fence vs 3×3

Enclosure range only when **(i)** the sensor is on a fence and **(ii)** that fence belongs to at least one closed fenced area. Inside a ring but not on a fence → ordinary 3×3. On a fence that closes nothing → inactive.

Paint: the fence (joins included) under the sensor. [[architecture/view]]

```
OFF FENCE, even inside a ring      ON FENCE, CLOSED
F F F F F F F                      F F F F F F F
F . . . . . F                      F . . . . . F
F . x x x . F                      F . . . . . F
F . x S x . F                      F . S . . . F   S is on the ring
F . x x x . F                      F . . . . . F
F . . . . . F                      F . . . . . F
F F F F F F F                      F F F F F F F
3×3 as if no fences                range = interiors of fenced areas S touches

ON FENCE, NOT CLOSED → inactive
F F F F F F F
F . . . . . F
F . . . . . .
S . . . . . F
```

Hover wash: the watched coord list, `fill-water` 0.35. On a fence with `fenceEnclosures` empty: no wash; look [[ui/sensors]].

## Invariants

`enclosure.close` — a 3×3 fence ring around one owned cell yields one enclosure; that interior; eight fence cells (corners included).

`enclosure.leak` — one orthogonal gap → zero enclosures. One diagonal gap → zero enclosures.

`enclosure.grid` — the plus in a 2×2 of rooms is in four `fenceEnclosures`.

`enclosure.nest` — inner-ring fence is in donut and hole; outer-ring fence is in donut only.

`enclosure.static` — eval / hover does not call rebuild. Rebuild only from fence add/remove and `indexAll`.
