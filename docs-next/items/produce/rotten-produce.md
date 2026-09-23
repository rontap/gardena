# Rotten produce

| | |
|---|---|
| item kind | `'rotten'` |
| unit | count |
| stack limit | `STACK_MAX` (+ `bulk-up`) |
| made by | fruit reaching 0 freshness; a plant dying overwatered; picking up a rotten plot |
| sold at | Market, after `unlock-fermentation` |

Fruit that has spoiled. It carries the crop class (`cls`: root, grain, fruit) and the day it rotted (`createdAt`).

## Variants

One per crop class: **Rotten {class}**. Stacks merge only with the same class; merging keeps the earlier `createdAt`.

## Properties

Rotten produce on the ground is removed at the end of the day once it has lain there for `ROTTEN_GROUND_DAYS`.

## Selling

Refused at the Market truck until `unlock-fermentation` is researched. After that, each unit pays 1 coin. Skills and the price drop do not apply (`World.clearance`).
