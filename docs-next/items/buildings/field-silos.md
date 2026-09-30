# Field silos

| | |
|---|---|
| size | `SILO_W` × `SILO_H` |
| Build tab | `automation` |
| unlocked by | `unlock-silos` |
| demolish | yes |

Stores built for vehicles: Tractor trailers load from and unload into them at their loading spots ([[features/vehicles]]).

## Kinds

| | Seeding silo | Additive silo | Produce silo |
|---|---|---|---|
| SKU | `buy-silo-seed` | `buy-silo-spray` | `buy-silo-produce` |
| cell kind | `'silo-seed'` | `'silo-spray'` | `'silo-produce'` |
| holds | seeds, up to `SILO_FIELD_SEED_CAP` | fertilizer, compost, Weed spray and sugar, up to `SILO_FIELD_ADDITIVE_CAP` L | `PRODUCE_SLOTS` slots of fruit, Pulled weed and Cut grass |
| same rules as | [[items/buildings/seed-silo]] | [[items/buildings/additive-store]] | a chest |
| Auto-restock | yes | yes | — |

**Auto-restock**: when a vehicle takes from a Seeding or Additive silo with Auto-restock on, the silo buys back what was taken, pack by pack or bag by bag, up to the level it held before, while the money lasts and the item can be bought. Named and Heirloom seeds are not restocked.

## Use

Opening a field silo shows the same panel as its starting-building counterpart; buying from that panel puts the purchase into the silo.

## Connections

Vehicle loading spots above and below ([[systems/building-io]]). No signal ports.

## Art

`prop-silo-seed.svg`, `prop-silo-spray.svg`, `prop-silo-produce.svg`.

## Sound

Opening and closing any of the three silos play the chest's lid sounds ([[systems/sound]]).
