# Signals

Code: `sensor.ts`, `evalSensors` in `nets.ts`, traffic-light update in `feature-vehicles/vehicle.ts`, wire placement in `world.ts`; see [[code-map]].

## Job

A signal is 0 (off) or 1 (on). Sensors and logic devices produce signals; wires carry them from an output to an input; machines, pumps, sprinklers, valves, logic devices and traffic lights read them. All signals are worked out once per step in `evalSensors`.

## Used by

- [[items/buildings/sensors-logic]], [[items/buildings/sensors-crop]], [[items/buildings/sensors-environment]] — the devices.
- [[features/water]] — sprinkler and valve inputs.
- [[systems/building-io]] — machine and pump inputs; chest, freezer, store and furnace outputs.
- [[features/vehicles]] — traffic lights on routes.

## Contract

### Ports

A device's `ports` lists its connection points: `out`, `in`, and for the Logic gate `in-l` and `in-r`. On the tile they sit here (`portXY`):

```
        in
    +---------+
    |         |
 in-l  device  in-r
    |         |
    +---------+
        out
```

Signal inputs outside sensors: machines (Mill, jam machine, Pot still, Furnace, research station, Infuser, Grinder) and pumps have `in`; with `in` at 1 they stop working. Sprinklers and valves have an input after `unlock-smart-irrigation`.

Signal outputs outside sensors: chest, freezer, Seed silo and Additive store are on when full; a Furnace is on when it holds no fuel units (`storeRaw`).

### Wires

A wire goes from one `out` to one input (`Wire`, `WireEnd`). One output can feed any number of wires. Several wires into one input are combined with OR: the input is on when any of them is on. A wire that would close a loop through NOT, Logic gate and lamp inputs is refused (**Cannot loop**, `wouldCycle`). Inputs of the Lever, Pulser, Counter and Traffic light do not count for loops: they use the value from the input when the step starts.

Demolishing a device removes its wires.

### Held outputs

Sensors that read the farm (crop, environment), stores, valve inputs and sprinkler inputs change their value through `stepHold`: when the new value differs from the current one, it switches at once and then stays for `SENSOR_HOLD` steps even if the reading changes back.

```
reading   ___/‾‾\_____/‾‾‾‾‾‾‾‾\____
output    ___/‾‾‾‾‾‾‾‾\_/‾‾‾‾‾‾‾‾‾‾‾‾\__
             |<-HOLD->|  |<-HOLD->|
```

### Order within a step

1. Each farm-reading sensor takes its reading and updates its held output.
2. Store and Furnace outputs update.
3. NOT gates, Logic gates and lamps are worked out in wire order (`evalDag`), so a chain of them settles in the same step.
4. Machine and pump inputs are set.
5. Traffic lights, then Levers, Pulsers and Counters take their input and update.
6. Valve and sprinkler inputs update, held.

Traffic light outputs are set later in the step by vehicle routing ([[items/buildings/sensors-logic]]).

## Data

Saved: wires, each device's settings and state, held valve inputs (`valveHold`). Signals are recomputed every step.

## When you change this

- New device: a class in `sensor.ts`, an entry in `MAKE`, its SKU, its raw value in `evalSensors` or its place in `evalDag`, its tuning panel in `objecthud.tsx`, save and digest handling.
- New signal input on a building: add `in` to its `ports` and read its `inn` where it acts ([[systems/building-io]]).
