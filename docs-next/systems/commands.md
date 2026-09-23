# Commands

Code: `log.ts`, `apply.ts`, `queue.ts`, `prompt.ts`, `feature-place/place.ts`; see [[code-map]].

## Job

Every change made by a player is a command: a JSON-serialisable object with the action letter, the step number, the seat and the action's arguments. Multiplayer sends commands between host and guests, and applying the same commands on the same step to the same `World` gives the same result. A click on a tile produces a job on the seat's job list; the gardener walks to the job's destination and performs it.

## Used by

Every feature with a player action. [[systems/net]] sends commands between host and guests.

## Contract

### Command type

`Cmd` in `log.ts` is a union over `a`, an action letter from `Act`. Every command has `t` (`World.now` when it was made), `p` (the seat) and its own arguments. Coordinates are `[col, row]`. A command must be unchanged by `JSON.stringify` followed by `JSON.parse`.

### Command flow

```
  UI code: world.tuneWater(at, ...)
      |
      | builds Cmd { a, t: world.now, p: world.local, ... }
      v
  commit ----- guest -----> World.remote ----> sent to host, host dispatches it
      |
      | solo or host
      v
  dispatch ---> World.log (last 500)
      |    \--> log.worker.ts (full list)
      v
  applyCmd ---> w.act = seats[cmd.p] ---> xBody(...)  changes World
```

1. UI code calls a `World` method, for example `tuneWater(at, …)`.
2. The method builds the `Cmd` and calls `commit`. On a multiplayer guest, `commit` passes it to `World.remote`, which sends it to the host ([[systems/net]]).
3. `dispatch` appends the command to the in-memory log and calls `apply`.
4. `applyCmd` in `apply.ts` sets `World.act` to the command's seat and calls the matching `xBody`.

The in-memory log keeps the last 500 commands (`World.log`, `logSince(n)`). `dispatch` also posts every command to the web worker in `log.worker.ts`, which keeps the full list; no code requests that list.

### Clicks and jobs

A click on a tile is `Act.click`. `clickBody` calls `readPrompt` in `prompt.ts` with the tile, the seat's hand and the seat's Build tool. The result is one of:

- `intent` — a job, added to the seat's job list;
- `place` — the selected building is placed immediately;
- blocked — the gardener shows the reason as speech; nothing else happens.

A job is an `Intent`: an action (`walk`, `shovel`, `plant`, `water`, `harvest`, `fill`, `pickup`, `chest`, `mill`, and others) and a target. The list holds at most `QUEUE_CAP` jobs. `tickQueue` processes the first job on each step:

1. If a work timer is running, it counts down; at zero, `finishWork` applies the job's effect.
2. If a bucket is filling, `tickFill` continues.
3. Otherwise the gardener walks toward `dest(job)`: a building's origin, the door for the inventory, the truck's loading spot for Drop off.
4. On arrival, `begin` either applies the effect at once or starts a work timer with `arm`.

```
  click on tile
      |
      v
  readPrompt(tile, hand, Build tool)
      |-- intent  --> job appended to seat.queue (max QUEUE_CAP)
      |-- place   --> building placed now
      '-- blocked --> speech line, nothing else

  each step, first job in seat.queue:
      work timer running?  --> count down --> 0: finishWork (effect)
      bucket filling?      --> tickFill
      not at dest(job)?    --> walk toward it
      at dest(job)         --> begin: effect now, or arm(work seconds)
```

`begin` checks again whether the job is still possible, because the tile can change between the click and the arrival. If not, the job is removed, in some cases with a speech line.

The hover line is built from the same `readPrompt` result as the click.

### Other commands

Buying, placing pipes and sprinklers, deleting, expanding, research, skills, inventory and chest swaps, taking from stores, tuning sensors and sprinklers, driving, key walking, vehicles, routes, contracts, the Necronomicon and cheats each have their own `Act` letter. They are applied when `applyCmd` runs, without a job.

## Entry points

- `Act`, `Cmd` in `log.ts`.
- `World.commit`, `dispatch`, `apply`; `applyCmd` in `apply.ts`.
- `readPrompt`, `readPromptHit` in `prompt.ts`; `World.prompt(at)`.
- `clickBody` in `place.ts`; `World.enqueueOn`; `tickQueue`, `begin`, `arm`, `finishWork`, `dest` in `queue.ts`.

## Data

The job list, work timer and bucket filling are seat fields. They are not saved; `rebase()` clears them. The command log is not saved.

## Invariants

| id | rule | test |
|---|---|---|
| — | every command is unchanged by `JSON.stringify` and `JSON.parse` | `log.test.ts` |
| — | each `Act` letter is fixed | `log.test.ts` |
| `world.queue` | at most `QUEUE_CAP` jobs; one more shows the list-full message | `queue.test.ts` |
| `world.on-arrival` | a job is checked again on arrival and removed without a message when nothing is left to do | `queue.test.ts` |
| — | tick changes (growth, rot, weeds, water, machines) are not commands | `plants.test.ts` |

## When you change this

- New player action: add an `Act` letter and a `Cmd` arm, an `x()` / `xBody()` pair, a case in `applyCmd`, and a decision on whether a guest may send it (`permit` in `mp.ts`, [[features/multiplayer]]).
- New click action on a tile: add the `Intent` arm, its result in `readPrompt`, its destination in `dest`, and its effect in `begin` or `finishWork`.
- UI code must not write `World` fields directly. The write would not reach the host or other guests.
