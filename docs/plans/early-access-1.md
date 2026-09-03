# 1.0 Early Access 1

Wrap-up and polish. **No new gameplay.** Menu, save/load, a short tutorial, two UI fixes.

Next agent: read [[canon]], [[pipeline]], [[aims]], [[ui/hud]], [[ui/shop]], [[ui/almanac]], [[architecture/log]]. Do not invent a second save format. Do not build multiplayer or a replay viewer.

---

## What this is

The player can start, leave, and come back. A new player gets a short tour. Shop prices line up. Almanac shows every pipe picture.

The farm does not gain crops, machines, or rules.

Contracts: [[architecture/save]] [[mechanics/tutorial]] [[ui/menu]] [[ui/tutorial]] [[art/menu]]

---

## Menu

The game **opens on a main menu**, not in the field.

Skip the menu only if the address has `#start_now` (example: `https://…/#start_now`). That jumps straight into a **new** farm.

The menu shows the game name **Gardena** and three buttons:

| Button | Does |
|---|---|
| **New Game** | Start a fresh farm. Play begins. |
| **Load Save** | Load the farm stored in the browser. Greyed out if there is no stored farm. |
| **Upload Save** | Pick a `.json` save file from disk, then play that farm. |

If load or upload fails, stay on the menu and tell the player the file could not be used. Do not silently start a broken farm.

---

## Save

The farm can be turned into JSON and back. One number on the file: **`version`: 1.0**.

### What is in the file

Everything you need to keep playing **except** the walk queue (the list of “go here and dig” jobs). After load, the gardener is idle.

Must come back:

- day, clock, money
- research finished, and the job that is running (name + time left)
- family points and chosen skills
- hand, house inventory, chests, items on the ground
- owned land and every tile (dirt, plants, weeds, grass, buildings, trees, rocks)
- pipes, valves, sprinklers, fences
- water in pumps and tanks
- stall stock
- how many uses tools have left
- the world seed (dirt pattern stays the same)

Camera, open panels, hover, and lens are **not** saved. They start as a new session.

Queued walks and jobs are **not** saved.

Anything added later must also be able to go into this file. **This release does not convert old files.** Try to read them. If they do not match version 1, try parsing anyway, but if they fail the same way as a bad upload.

### When it writes

- **End of day** (the recap): write to `localStorage` key `gardena-save-slot-1`.
- In-game **Save game**: write that same slot **now**.
- **Download Save**: download the JSON as a file. Does not have to write `localStorage` as well, but it may.

**Upload Save** that works becomes the current farm **and** is written to `gardena-save`.

This is a **snapshot of the farm**, not a replay of clicks. The action log from 0.9 can stay running. It is not the save file.

---

## Gear (in play)

Top ribbon, far right: a **gear** button. Same size language as the other HUD icons. [[ui/hud]]

Click → the **same menu shell** as startup, but only two buttons:

| Button            | Does                                                           |
| ----------------- | -------------------------------------------------------------- |
| **Save game**     | Write `gardena-save-slot-1` now. Then close, back to the farm. |
| **Download Save** | Download the JSON file.                                        |

 New Game / Load / Upload here too, discards current save. Esc or the usual close puts you back on the farm. Recap still blocks other panels.

---

## Almanac pipes

Crop pages already **cycle pictures** (growth stages). The **pipe** page must cycle the same way through **every pipe join picture** (stub, I, L, T, X — whatever art already exists). Not one static pipe icon.

Valve and sprinklers stay their own list rows. This is only the pipe page.

---

## Tutorial

Off when:

- the url has `#start_now`, **or**
- `gardena-save` already exists (even if they press New Game)

On for a first-time New Game with no stored farm.

One step on screen at a time. Advance when the player has done that step. **Step 2 does not show a counter** (no “2 / 4”). Same text until it is done.

| Step | When it shows | Player should |
|---|---|---|
| 1 | Start | Hear the loop (grow → sell → buy tools). Click grass with the shovel to till. |
| 2 | After they till once | Till **four more** plots. |
| 3 | Five tilled plots | Click the house, put seeds in hand. |
| 4 | Holding seeds | You only carry **one** thing. Plant on tilled plots. |
| 5 | At least one seed planted | Open Research, start **any** project. |
| 6 | Any growing plant is **wilting** (thirsty) | Pick up the bucket at the door, fill at the pump, water. Say the bucket holds **3 L** (`CONTAINERS.bucket`). |
| 7 | Any plant is **ripe** | Buy a fruit box, place it. |
| 8 | Box is placed (or they already have one) | Pick **any** fruit. |
| 9 | Holding fruit (or fruit in a box) | Walk to the truck, **Sell all**. |
| 10 | After a sale | Short goodbye. Then the tutorial is gone for this farm. |

Draft words (use these if the user does not rewrite):

1. *Till, plant, water, harvest, sell, buy better tools. Click a grass tile to dig.*
2. *Dig four more plots.*
3. *Click the house and take seeds in hand.*
4. *You only carry one item. Plant the seeds.*
5. *Open Research and start something.*
6. *A plant is thirsty. Pick up the bucket (3 L), fill it at the pump, water the plant.*
7. *Something is ripe. Buy a fruit box and place it.*
8. *Pick any fruit.*
9. *Drop it at the truck and Sell all.*
10. *That’s the tour. You’re on your own.*

Do not block the rest of the HUD. Do not force the camera. If they skip ahead (e.g. already have a box), jump to the matching step.

---

## Out of scope

- New crops, buildings, skills, diseases, weather
- Replay viewer, multiplayer
- Converting old saves
- Changing how the farm plays

---

## Build order

architect (save file + tutorial predicates, menu / gear / tutorial card) → designer (gear + menu if new art) → coder → code-review → documenter ∥ game-text-writer.

---

## Locked

- One localStorage key: `gardena-save-slot-1`. Load, upload, end-of-day, and Save game all use it. Tutorial-off = that key exists. Download filename `gardena.json`.
- Save JSON identity: `game: "gardena"`, `version: 1.0`. A file is ours iff `game` is `"gardena"`. Version mismatch is not an automatic refuse — try to parse anyway; if that fails, the reason is version.
- Load/upload fail stays on the menu. Copy **gives the reason**: not a Gardena save (missing/wrong `game`), version mismatch, or the file could not be used.
- In-play gear menu: same shell as startup. Five buttons — **New Game**, **Load Save**, **Upload Save**, **Save game**, **Download Save**. New/Load/Upload discard the current farm with no confirm. Esc/close returns to the farm. Recap still blocks this panel.
- Designer: `ui-btn-gear.svg` (idle/hover/selected/disabled, same language as other HUD faces) **and** a menu illustration behind the wordmark.
- Tutorial: bottom-center Chrome card. No step counter. HUD stays usable. Camera not forced. Draft words in this note.
- Step 10: show until the player clicks the tutorial card. Then the tour is off for this farm (this session). No timer.
- Shop prices: out of scope. Almanac pipe cycling is the UI fix.
