# Field silos as stops

Feature. Graduates into [[mechanics/vehicles]], [[mechanics/inventory]], [[ui/vehicles]], [[ui/store]]. Copy: [[standards/user-facing-text]]. Seed grinder / Compost box / Furnace mill-pattern: [[plans/next-automation]].

The three field silos already hold seed, bags, and fruit. You walk up and use the house-store panels. Auto-restock buys back what you take by hand. South of each silo the map draws hangar-return arrows. A Quad or Tractor cannot Load or Unload there. A route cannot stop there for load or unload. This update makes those pads real.

## Live (keep)

| silo | holds | panel | walk-up |
|---|---|---|---|
| Seeding silo | `SeedStore`, `SILO_FIELD_SEED_CAP` | seed grid | `silo` |
| Additive silo | `AdditiveHolder`, `SILO_FIELD_ADDITIVE_CAP` | additive list | `additives` |
| Produce silo | slots, fruit / weed / grass | chest grid | `chest` |

Buy row on the open panel puts the pack or bag in *that* silo. `Act.takeStore` carries `s: XY`. `SiloSeed.restock` / `SiloSpray.restock` run on `Act.takeStore` only, `'base'` packs and the four `ROW_SKU` bags, not named Variety, not compost.

House `seed-silo` and `additive-store` already have pads `'both'` and sit in `padBuildings`. Field silos `pads: 'none'`, `ports: []`. South pad arrows are view-only. Not Dock.

Spray trailer hopper: fertilizer, synthetic fertilizer, or compost. `weed-spray` in that hopper is unrepresentable.

## New

Field silos `pads: 'both'`. `padBuildings` includes them (walk `silos` the way it walks `machines`). Dropoff north Unload, takeup south Load, same geometry as hangar-sized footprints — `siloPad` is already the south two cells; takeup is that pad. Dropoff is the north row of the footprint.

`Act.load` / `Act.unload` (seated and auto after `DISPATCH_DWELL`) use `accept` / `apply` on that silo, same as the house Seed silo. A route may add a load or unload stop on those pads. `stopAt` / `padHit` no longer skip field silos.

Auto-restock: on a successful Load from a Seeding silo or Additive silo, run the same restock body `Act.takeStore` uses. Vehicle take is a removal. Named Variety and compost still do not restock.

Ports stay `[]`. Field silos are not sensors. `out` / full-signal is not this update.

Pad arrows stay. They now match Load / Unload.

Delete still always. Guest already places the three SKUs.

## Spray trailer

Hopper may hold `weed-spray` as a fourth bag kind, same `TRAILER_CAP` liters. Boom spray on a tilled plot spends weed spray the way a hand Spray does, not fertilizer. A hopper still holds one bag; mixing kinds stays unrepresentable. `vehicles.unrep` loses the weed-spray clause.

## Not this update

House stores already Load. Barrel. Seed grinder pads — [[plans/next-automation]]. Multiple default stores (`useDefault` seam). Dock on a silo pad (store a vehicle).
