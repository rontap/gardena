# Docks and dialogs

Shop, research, lens, and cheat are left docks. Family, market, and almanac are centered overlays. Inventory, chest, seed silo, additive store, and recap are dialogs. Sprinkler tune is an object HUD on the map.

## Left docks

`Dock` `absolute top-24 left-32 z-20`, `max-h-[calc(100vh-6rem)]`. Clears the `h-14` [[ui/hud]] ribbon and the icon rail. Ghosts stay on the map.

| panel | title | width |
|---|---|---|
| shop | General store | `wide` `w-[30rem]` |
| research | Research | `wide` `w-[30rem]` |
| lens | Lens | `w-80` |
| cheat | Cheat | `w-80` |

`Window` is the shell for all three: display-font title, hairline under it, `scroll-pane` body, hairline over an optional footer. Sized so the common case does not scroll at 1440×900 — [[ui/type]].

[[ui/shop]]. [[ui/lens]]. [[ui/cheat]].

Research: trees **Plants** **Utilities** **Expansion** **Automation**. 2-col cards. Card = icon + name, then `Coin` + seconds. Faces: done `bg-leaf/20` and reads **Done**, running `bg-ink`, gated or blocked-by-another-job `bg-ink/6`, else `bg-dirt`. Gated cards add a `roof` bar and `{have} / {n} {digs|mines}` — [[mechanics/research]]. Bar `bg-leaf` if running or done. Hover: [[ui/callout-hover]] to the right of the dock, title `RESEARCH[id].name`, description blurb plus the gate sentence. Footer: the running job and its seconds, or *One project at a time. It runs while you garden.* `Dock` `aside` is the callout slot. Unlock-all lives on [[ui/cheat]].

Plants: `unlock-grape` **Grape seeds** visible at start. `unlock-olive` after tomato. `unlock-raspberry` after grape. No vanilla research card. Automation: **Fermentation** (`unlock-fermentation`) at start.

**×** / Shop toggle that closes shop: `cancelPlace`; pipes lens `off`. Research **×** only closes the dock.

## Overlays

[[ui/family]] · [[ui/market]] · [[ui/almanac]]. `absolute inset-0` dim `bg-ink/40`. Not docks. Family content centered `w-[58rem]` — [[ui/family]].

Every dialog and overlay closes on backdrop, except recap until a member is picked, and except guest recap (no dismiss). Radix dialogs (inventory, chest, recap) get it from `onOpenChange`; overlays close on a pointer-down whose target is the backdrop itself. Catching-up overlay does not dismiss. [[ui/multiplayer]]

## Inventory

Walk to the house → cue → dialog **Inventory**. 4×4, this seat's 16 (`App.local`). Click slot `swap(i)` with that seat's hand. Fruit line via `ItemLineView`. Wide `w-[30rem]`.

## Stores

Walk to the seed silo or the additive store → cue → dialog. Deposit happens on arrival; the panel only withdraws. [[ui/store]] [[mechanics/inventory]]

## Chest

Walk to a chest → cue → dialog **Chest**. 3×3, `CHEST_SLOTS` 9. Click `swapChest(at, i)`. Close acks the cue. Guests: dialog does not open; `swapChest` locked.

## Recap

Seam dialog, `w-[26rem]`. `ui-recap-night` strip on top ([[art/recap-night]]). Title **Day {ended}**.

Tally rows **Harvested** **Lost** **Research** (`RESEARCH[id].name`, comma-joined; `—` when none). Rule, then ledger **Stipend** `+` coin and **Tax** `−` coin. Rule, then **Balance** coin — money after tax.

**Day {next}**. Backdrop / Esc also `dismissRecap()`. Play frozen until that call. Each dismiss grants +1 skill point to every member — not shown on this screen. Guest: no dismiss. **Day {next}**, backdrop, and Esc do not `dismissRecap()`. [[mechanics/day]] [[mechanics/family]] [[ui/multiplayer]]

## Object HUD

Only sprinklers, and only after **Tune sprinkler** (`unlock-smart-sprinkler`). Anchored at the vertex. Title **Sprinkler output**.

**Full flow** (`SPRINKLER_TILE_DAY` L/day per tile) plus one row per drinking crop (`waterUsePerSec > 0`), L/day per tile at common stats. Pick sets `tune` and closes. **×** `closeHud`. Map click elsewhere also closes unless it is another sprinkler-hud hit.
