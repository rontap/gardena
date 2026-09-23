# Building I/O

Code: `building.ts`, `feature-machines/machine.ts`, `feature-machines/machines.tick.ts`, `feature-machines/machines.emit.ts`, pad functions in `feature-vehicles/vehicle.ts`; see [[code-map]].

## Job

Defines where a placed building sits on the grid and how items move into and out of it: from the player's hand, from a chest beside it, into a chest beside it or onto the ground, and to and from vehicles. Machines, stores and chests all use these rules.

## Used by

- [[features/machines]] — machine input and output.
- [[features/inventory]] — chests, freezers, stores.
- [[features/vehicles]] — loading and unloading at buildings.
- [[features/sensors]] — signal ports on buildings.
- [[features/build]] — footprints when placing.

## Contract

### Footprint

A placed building has a `base`: a `RectBase` (`col`, `row`, `w`, `h`), or a `CircleBase` for round objects. `occupiedCells(base, owned)` lists the tiles it covers; the same building instance is stored in each of them ([[systems/world]]). The origin tile is the top-left tile (`originCell`).

`SKU_FOOT` gives the width and height of each placeable SKU; `skuBase(id, at, facing)` builds the base for a placement at `at`. The Sorter is the only building whose footprint depends on its facing (`sorterBase`).

### Hand input

Clicking a machine with an item in hand queues a job. On arrival, the machine's `accept(item)` returns how many units it takes, and `apply(item, n)` adds them. Items the machine refuses stay in the hand. Most machines lock to the first crop and variety put in and refuse others until empty ([[features/machines]]).

### Chest input and output

For a building with a tick (`machines` index), the input side is the tile left of its bottom row (`machineWest`) and the output side is the tile right of its bottom row (`machineEast`).

- Input: on each big tick, `pullMachineStores` takes from a chest or freezer on the input side every item the machine accepts, using the same `accept` / `apply` as hand input. A machine with `takeAll` empties a slot at once; others take the accepted count.
- Output: when a machine finishes a product, `emitProduct` puts it into a chest or freezer on the output side. If that chest is full, the product is not emitted and the machine waits. If there is no chest on the output side, the product is dropped on the first free plot around the building (`dropSpot`: tiles below, then left, then right, then above).

A 2 × 2 machine (`M`) with a chest on each side:

```
            +---+---+
            | M | M |
  +-----+   +---+---+   +-----+
  |chest|-->| M | M |-->|chest|
  +-----+   +---+---+   +-----+
   input                 output
   machineWest           machineEast
```

Only the bottom row has an input and an output tile. A chest next to the top row is not connected.

The order `dropSpot` tries when there is no output chest (`frontOfBase`): 1 the row below, left to right; 2 the column to the left, top to bottom; 3 the column to the right, top to bottom; 4 the row above, left to right. The first tile that is a plot is used.

```
         4   4
       +---+---+
     2 | M | M | 3
       +---+---+
     2 | M | M | 3
       +---+---+
         1   1
```

`storePorts()` returns a building's input and output tiles; `defaultStorePorts` is the left and right tile of the bottom row. The Sorter has one input and three outputs, one per variety tier, facing its direction (`sorterPorts`). The Refueling station has an input only.

A Sorter facing `e` (three tiles tall; facing `n` or `s` it lies flat):

```
              +---+
              | S |--> Plain
              +---+
  input  -->  | S |--> Named
              +---+
              | S |--> Heirloom
              +---+
```

### Vehicle loading spots

A building with `pads: 'both'` has vehicle loading spots (`padPorts`, `defaultPadPorts`): each tile directly above the building is an unload spot (the vehicle puts items into the building), and each tile directly below is a load spot (the vehicle takes items out).

```
        U   U        U  unload spot: vehicle -> building
      +---+---+
      | M | M |
      +---+---+
      | M | M |
      +---+---+
        L   L        L  load spot: building -> vehicle
``` 
`padGoods(role)` limits which items a spot handles. Buildings with loading spots: machines (including the Grinder), chests, freezers, the compost box, the stores and the field silos. The Barrel has none. See [[features/vehicles]].

### Signal input

A `Machine` has an `inn` signal. While `inn` is 1, the machine does not start or advance production; hand, chest and vehicle input still fill it ([[systems/signals]]). `ports` on a building lists its signal ports (`in`, `out`); a chest has a signal output that is on when it is full.

## Entry points

- `occupiedCells`, `originCell`, `skuBase`, `SKU_FOOT`, `skuPorts`.
- `BaseBuilding`: `accept`, `apply`, `storePorts`, `padPorts`, `padGoods`, `tick`, `pads`, `takeAll`, `ports`, `ticks`.
- `Machine` (adds `inn`); `isIoCell`, `machineWest`, `machineEast`.
- `pullMachineStores`, `emitProduct`, `emitPair`, `dropSpot`, `emitSorted`, `pullSorted`.
- `isPadCell`, `padDropCells`, `padTakeCells`.

## Data

Building contents are saved with the building's cell. `inn` is worked out from wires each step and is not the source of truth ([[systems/signals]]).

## Invariants

| id | rule | test |
|---|---|---|
| — | a machine with `inn` at 1 does not advance; dropping in and unloading still fill it | `plants.test.ts` |
| — | a machine outputs into a chest or freezer on its output side | `machine.test.ts` |

## When you change this

- New building: add its footprint to `SKU_FOOT`, a class extending `BaseBuilding` or `Machine`, `accept` / `apply` for what it takes, `pads` and `padGoods` if vehicles use it, `ports` if it takes or gives a signal, a cell kind ([[systems/world]]), save handling ([[systems/save]]). See [[howto/add-building]].
- Changing which side is input or output: machine art, the ghost arrows shown while placing, vehicle route stops and player layouts depend on it ([[features/build]], [[features/vehicles]]).
