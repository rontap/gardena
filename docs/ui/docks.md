# Docks and dialogs

Build, research, lens, and cheat are left docks. Family, market, and almanac are centered overlays. Inventory, chest, seed silo, additive store, recap, hangar, and parked Quad / tractor are dialogs. Sprinkler tune and water / harvest / counter / day / logic / variety / weather / pressure sensor config are object HUDs on the map. Hangar and vehicle cues are not docks. Field silos: look only, no dialog — [[ui/vehicles]]. Dash cargo and the stops Window are driving overlay, not a dock or Object HUD — [[ui/vehicles]]. Traffic light: no config HUD — [[ui/sensors]].

## Left docks

`Dock` `absolute top-20 left-32 z-20`, `max-h-[calc(100vh-6rem)]`. `top-20` is the [[ui/hud]] icon rail's own top: a dock and the rail beside it start on the same line. Clears the `h-14` ribbon. Ghosts stay on the map. Ghosts stay on the map.

| panel | title | width |
|---|---|---|
| build | Build | `w-[28rem]` |
| research | Research | `w-[28rem]` |
| lens | Lens | `w-80` |
| cheat | Cheat | `w-80` |

`Window` is the shell for all of them: display-font title, hairline under it, `scroll-pane` body, hairline over an optional footer. Sized so the common case does not scroll at 1440×900 — [[ui/type]].

## The rail

Build and Research pick a category the same way: a vertical `Tabs.List`, `tabRailListClass`, an active left border and swatch instead of an underline. `-my-3 -ml-4` bleeds it through the `scroll-pane` padding so the rule and the swatch reach the window edge — a rail floating inside a margin reads as a stray box. Triggers carry the inset back as `pl-4`.

Cards under it share one anatomy: icon `h-10` centred, `skuLabel` / research name `text-sm` `line-clamp-2 min-h-8`, then the meta line. A constant `auto-rows-*` per panel, never `fr`, so no card changes size as content changes.

[[ui/almanac]] is a centred overlay and keeps the underline `tabTriggerClass`.

[[ui/build]]. [[ui/lens]]. [[ui/cheat]].

Research: trees **Plants** **Land** **Automation** **Trade** on the rail, in that order. 2-col cards on `auto-rows-[8.5rem]` — two columns, not three, because the progress bar needs the width. Card = icon over name over `Coin` + seconds on one line. Faces: done `bg-leaf/20` and reads **Done**, running `bg-ink`, gated or blocked-by-another-job `bg-ink/6`, else `bg-dirt`. Bar `bg-leaf` if running or done. Hover: [[ui/callout-hover]] to the right of the dock, title `RESEARCH[id].name`, description blurb plus the `why` sentence. Footer: the running job and its seconds, or *One project at a time. It runs while you garden.* `Dock` `aside` is the callout slot. Unlock-all lives on [[ui/cheat]].

A card is on the shelf when `researchShown` — `reveal` is OR, `[]` is start. A shown card is clickable when `researchOpen` — `requires` is AND. Gated is a disabled face, and `why` names what is missing: *Needs {names joined by and} first.* `unlock-smart-irrigation` and `unlock-heirloom` can be shown and shut. `why` order: done, running, gated, another job, cannot afford. [[mechanics/research]]

Ten rows open at start, 3 / 1 / 2 / 4 across the four tabs. Plants start shelf: **Synthetic fertilizer**, **Tomato seeds**, **Grape seeds**. Grape seeds on the shelf from the first day. **Crop variants** after tomato, grape, or irrigation. **Raspberry seeds** after tomato or grape. **Heirloom crops** after Crop variants, or after land/vehicles (then shut until Crop variants). No vanilla, no olive, no watermelon research card. Land: **Unlock land** only. Automation: **Irrigation** and **Sensors**. Trade: **Contracts**, **Better gardening tools**, **Chest**, **Machinery**; **Fermentation** after the grinder.

**×** / the rail toggle that closes **Build**: `leaveBuild` = `cancelPlace`, search query cleared, unlocked Build peek restored. A tool lens ends with the arming. A locked lens stays — [[ui/lens]]. Selecting Build Water / Sensors is not a close: `onShelf` peeks that lens with no lock, no SKU armed. Automation peeks no lens. Storage peeks no lens. Closing the **Lens** dock drops an unlocked lens to `off` and keeps a locked one. Research **×** only closes the dock.

## Overlays

[[ui/family]] · [[ui/market]] · [[ui/almanac]]. `absolute inset-0` dim `bg-ink/40`. Not docks. Family content centered `w-[58rem]` — [[ui/family]].

Solo (`role === 'off'`): these three and the recap popup pause the sim clock. Close restores the previous pause state unless the player had already paused. Host / guest: no auto-pause. Build / Research / Cheat / Lens do not auto-pause. [[ui/hud]]

Every dialog and overlay closes on backdrop. Recap Close / Esc / backdrop is live for guest. Radix dialogs (inventory, chest, recap, hangar, parked Quad / tractor) get it from `onOpenChange`; overlays close on a pointer-down whose target is the backdrop itself. Catching-up overlay does not dismiss. [[ui/multiplayer]]

## Inventory

Walk to the house → cue → dialog **Inventory**. 4×4, this seat's 16 (`App.local`). Click slot `swap(i)` with that seat's hand. Fruit line via `ItemLineView`. Wide `w-[30rem]`.

## Stores

Walk to the seed silo or the additive store → cue → dialog. Deposit happens on arrival; the panel only withdraws. [[ui/store]] [[mechanics/inventory]]

## Chest

Walk to a chest → cue → dialog **Chest**. 3×3, `CHEST_SLOTS` 9. Click `swapChest(at, i)`. Close acks the cue. Guests: dialog does not open; `swapChest` locked.

## Hangar / parked vehicle

Walk-up hangar or parked / automated Quad / tractor → cue → dialog. Not docks. Not Object HUD. Close acks. Map click closes like chest. Guests: both dialogs open. Driving HUD is overlay chrome, not a dock or dialog; **Dock** is that dash button. Stops Window is that driving overlay. Hangar **Automate** next to **Deploy**. Field silos: no cue. [[ui/vehicles]]

## Recap

Not a seam dialog. App opens it from a recap notice. Hidden unless App has a `recapDay`. `w-[26rem]`. `ui-recap-night` strip on top ([[art/recap-night]]). Title **Day {ended}**. Subtitle **turned in** unchanged.

Tally rows **Harvested** **Lost** **Research** (`RESEARCH[id].name`, comma-joined; `—` when none). When `unlock-contracts` done: that day's `Recap.contracts` as one-line history (company, stars, day, completed / missed / cancelled, `Coin` paid / penalty / fee) then **A new board is up.** Omit the block when not unlocked. [[ui/contracts]] [[mechanics/contracts]]

Rule, then ledger **Support from grandma** `+` coin from `recap.stipend` when `stipend > 0`, **Tax** `−` coin, **Water** `−` `recap.water` coin. Omit the stipend line when `recap.stipend === 0`. Amounts via fill from `stipendOf` / `STIPEND`, not digits in the copy. Always a Water line. Same chrome as Tax. Not a weather forecast. Rule, then **Balance** coin — money after tax and pump bill. [[mechanics/weather]] [[mechanics/day]] `day.stipend`

Footer **Close**. Backdrop / Esc: same as Close. Close runs `World.seeRecap(day)` and closes the popup. Guest Close live (chrome, not a gate). `seeRecap` is not a `Cmd`. `Act.dismissRecap` is a no-op. Points already granted at the seam — not shown on this screen. Recap popup uses the same overlay pause as Family / Market / Almanac. [[mechanics/day]] [[mechanics/family]] [[ui/notices]] [[ui/hud]] [[ui/multiplayer]]

## Object HUD

Same `Chrome` shell, `w-56`, anchored on the map. Not a dock. Family: sprinkler tune + water / harvest / counter / day / logic / variety / weather / pressure sensor config. Sensor rows: `Checkbox` / `Radio` from `frame.tsx`. No new chrome. [[ui/sensors]]

Sprinklers, only after **Smart irrigation** (`unlock-smart-irrigation`) — the same row that grants the signal input. Anchored at the vertex. Title **Sprinkler output**.

One slider, `0` to `SPRINKLER_TILE_DAY` litres a day per tile, `SPRINKLER_STEP` a stop, the set amount read out under it. Above the track, one mark per drinking crop (`waterUsePerSec > 0`) at the amount that crop drinks at common stats; clicking a mark sets the slider to it. Crops that drink the same amount share a spot and stack. `w-72`, wider than the sensor HUDs, because the marks need the room. The slider stays open while you drag it. **×** `closeHud`. Map click elsewhere also closes unless it is another sprinkler-hud / water / harvest / counter / day / logic / variety / weather / pressure hit. Guest: no sprinkler HUD.

Water / harvest / counter / day / logic / variety / weather / pressure: remote, no walk. Centered above the cell. Rows: muted **Send signal when...** then the ticks. Titles **Water sensor** / **Harvest sensor** / **Counter** / **Day sensor** / **Logic gate** / **Variety sensor** / **Weather sensor** / **Pressure plate**. Check: **Wilting** **Overwatered** (default both on) / **Sunrise** **Day** **Sunset** **Twilight** (default **Day** on) / variety **Plain** **Named** **Heirloom** (default Plain on) / weather **Clear** **Rain** **Dry** **Flood** **Drought** (default **Clear** on) / pressure **Vehicle** **You** **On the ground** (default Vehicle on). Radio: **Any** / **All** (default Any) / logic **OR** / **AND** (default OR). Counter: live count, **Count to** + `Field` **n**, **Reset**. Not a crop list. Apply immediately and stays open. Guest: yes. While water / harvest / variety / pressure HUD is open, that sensor’s watched set `fill-water` 0.35. Counter / day / logic / weather: no wash. Unarmed hover of a range-reader (water, fertilizer, harvest, variety, pressure plate) and an armed range-reader SKU: watched set. Fertilizer: no HUD. Traffic light: no HUD, no wash. Map click another of those hits retargets. Guest: no sprinkler HUD.
