# Docks and dialogs

Shop, build, research, lens, and cheat are left docks. Family, market, and almanac are centered overlays. Inventory, chest, seed silo, additive store, recap, hangar, and parked Quad / tractor are dialogs. Sprinkler tune and water / harvest / counter / day sensor config are object HUDs on the map. Hangar and vehicle cues are not docks. Field silos: look only, no dialog — [[ui/vehicles]]. Dash cargo and the stops Window are driving overlay, not a dock or Object HUD — [[ui/vehicles]]. Traffic light: no config HUD — [[ui/sensors]].

## Left docks

`Dock` `absolute top-20 left-32 z-20`, `max-h-[calc(100vh-6rem)]`. `top-20` is the [[ui/hud]] icon rail's own top: a dock and the rail beside it start on the same line. Clears the `h-14` ribbon. Ghosts stay on the map. Ghosts stay on the map.

| panel | title | width |
|---|---|---|
| shop | General store | `w-[28rem]` |
| build | Build | `w-[28rem]` |
| research | Research | `w-[28rem]` |
| lens | Lens | `w-80` |
| cheat | Cheat | `w-80` |

`Window` is the shell for all of them: display-font title, hairline under it, `scroll-pane` body, hairline over an optional footer. Sized so the common case does not scroll at 1440×900 — [[ui/type]].

## The rail

Shop, Build, and Research all pick a category the same way: a vertical `Tabs.List`, `tabRailListClass`, an active left border and swatch instead of an underline. `-my-3 -ml-4` bleeds it through the `scroll-pane` padding so the rule and the swatch reach the window edge — a rail floating inside a margin reads as a stray box. Triggers carry the inset back as `pl-4`.

Cards under it share one anatomy: icon `h-10` centred, `skuLabel` / research name `text-sm` `line-clamp-2 min-h-8`, then the meta line. A constant `auto-rows-*` per panel, never `fr`, so no card changes size as content changes.

[[ui/almanac]] is a centred overlay and keeps the underline `tabTriggerClass`.

[[ui/shop]]. [[ui/build]]. [[ui/lens]]. [[ui/cheat]].

Research: trees **Plants** **Land** **Automation** **Trade** on the rail, in that order. 2-col cards on `auto-rows-[8.5rem]` — two columns, not three, because the progress bar needs the width. Card = icon over name over `Coin` + seconds on one line. Faces: done `bg-leaf/20` and reads **Done**, running `bg-ink`, gated or blocked-by-another-job `bg-ink/6`, else `bg-dirt`. Bar `bg-leaf` if running or done. Hover: [[ui/callout-hover]] to the right of the dock, title `RESEARCH[id].name`, description blurb plus the `why` sentence. Footer: the running job and its seconds, or *One project at a time. It runs while you garden.* `Dock` `aside` is the callout slot. Unlock-all lives on [[ui/cheat]].

A card is on the shelf when `researchShown` — `reveal` is OR, `[]` is start. A shown card is clickable when `researchOpen` — `requires` is AND. Gated is a disabled face, and `why` names what is missing: *Needs {names joined by and} first.* `unlock-smart-irrigation` and `unlock-heirloom` can be shown and shut. `why` order: done, running, gated, another job, cannot afford. [[mechanics/research]]

Ten rows open at start, 3 / 1 / 2 / 4 across the four tabs. Plants: **Synthetic fertilizer**, **Tomato seeds**, **Watermelon seeds**; **Crop variants** after tomato, watermelon, or irrigation; **Grape seeds** after either tomato or watermelon; **Raspberry seeds** after any basic fruit; **Heirloom crops** after Crop variants, or after land/vehicles (then shut until Crop variants). No vanilla and no olive research card. Land: **Unlock land** only. Automation: **Irrigation** and **Sensors**. Trade: **Contracts**, **Better gardening tools**, **Chest**, **Machinery**; **Fermentation** after the grinder.

**×** / a rail toggle that closes **Shop** or **Build**: `leaveShop` = `cancelPlace` and search query cleared. It does not touch the lens: a tool lens ends with the arming, and a picked lens is the Lens dock’s business — [[ui/lens]]. Selecting Build **Sensors** (`logic`) is not a close: `onShelf('logic')` → sets and locks `sensors`, no SKU armed. Closing the **Lens** dock drops an unlocked lens to `off` and keeps a locked one. Research **×** only closes the dock.

## Overlays

[[ui/family]] · [[ui/market]] · [[ui/almanac]]. `absolute inset-0` dim `bg-ink/40`. Not docks. Family content centered `w-[58rem]` — [[ui/family]].

Every dialog and overlay closes on backdrop, except recap until a member is picked, and except guest recap (no dismiss). Radix dialogs (inventory, chest, recap, hangar, parked Quad / tractor) get it from `onOpenChange`; overlays close on a pointer-down whose target is the backdrop itself. Catching-up overlay does not dismiss. [[ui/multiplayer]]

## Inventory

Walk to the house → cue → dialog **Inventory**. 4×4, this seat's 16 (`App.local`). Click slot `swap(i)` with that seat's hand. Fruit line via `ItemLineView`. Wide `w-[30rem]`.

## Stores

Walk to the seed silo or the additive store → cue → dialog. Deposit happens on arrival; the panel only withdraws. [[ui/store]] [[mechanics/inventory]]

## Chest

Walk to a chest → cue → dialog **Chest**. 3×3, `CHEST_SLOTS` 9. Click `swapChest(at, i)`. Close acks the cue. Guests: dialog does not open; `swapChest` locked.

## Hangar / parked vehicle

Walk-up hangar or parked / automated Quad / tractor → cue → dialog. Not docks. Not Object HUD. Close acks. Map click closes like chest. Guests: both dialogs open. Driving HUD is overlay chrome, not a dock or dialog; **Dock** is that dash button. Stops Window is that driving overlay. Hangar **Automate** next to **Deploy**. Field silos: no cue. [[ui/vehicles]]

## Recap

Seam dialog, `w-[26rem]`. `ui-recap-night` strip on top ([[art/recap-night]]). Title **Day {ended}**.

Tally rows **Harvested** **Lost** **Research** (`RESEARCH[id].name`, comma-joined; `—` when none). When `unlock-contracts` done: that day's `Recap.contracts` as one-line history (company, stars, day, completed / missed / cancelled, `Coin` paid / penalty / fee) then **A new board is up.** Omit the block when not unlocked. [[ui/contracts]] [[mechanics/contracts]]

Rule, then ledger **Stipend** `+` coin and **Tax** `−` coin. Rule, then **Balance** coin — money after tax.

**Day {next}**. Backdrop / Esc also `dismissRecap()`. Play frozen until that call. Each dismiss grants +1 skill point to every member — not shown on this screen. Guest: no dismiss. **Day {next}**, backdrop, and Esc do not `dismissRecap()`. [[mechanics/day]] [[mechanics/family]] [[ui/multiplayer]]

## Object HUD

Same `Chrome` shell, `w-56`, anchored on the map. Not a dock. Family: sprinkler tune + water / harvest / counter / day sensor config. No new chrome. [[ui/sensors]]

Sprinklers, only after **Smart irrigation** (`unlock-smart-irrigation`) — the same row that grants the signal input. Anchored at the vertex. Title **Sprinkler output**.

**Full flow** (`SPRINKLER_TILE_DAY` L/day per tile) plus one row per drinking crop (`waterUsePerSec > 0`), L/day per tile at common stats. Pick sets `tune` and closes. **×** `closeHud`. Map click elsewhere also closes unless it is another sprinkler-hud / water / harvest / counter / day hit. Guest: no sprinkler HUD.

Water / harvest / counter / day: remote, no walk. Anchored at the cell. Titles **Water sensor** / **Harvest sensor** / **Counter** / **Day sensor**. Checkboxes **Wilting** **Overwatered** (default both on) / **Any** **All** (default Any) / **Sunrise** **Day** **Sunset** **Twilight** (default **Day** on). Counter: live count, **Count to** + `Field` **n**, **Reset**. Not a crop list. Apply immediately and stays open. Guest: yes. While water / harvest HUD is open, that sensor’s 3×3 `fill-water` 0.35. Counter / day: no wash. Traffic light: no HUD, no wash.
