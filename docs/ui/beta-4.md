# Beta-4 UI

**Historical.**

See [[mechanics/beta-4]], [[architecture/beta-4]], [[art/beta-4]]. Beta-3 chrome holds except below.

## HUD

Majors, same size family: **Shop**, **Research**, **Market**, **Almanac**, **Lens**.

Research bar text = `RESEARCH[id].name`, never the id.

## Buttons

Replace `Btn` for HUD majors, shop rows, research rows.

Tokens only (`dirt` `dirt-dark` `house` `roof` `ink`). Keep top `ui-header` strip.

| state | face |
|---|---|
| idle | `bg-dirt` `text-house` |
| hover / pressed | `bg-dirt-dark` `text-house` |
| selected | `bg-ink` `text-house` |
| disabled | `bg-house` `text-ink/40` `cursor-default` — greyed, readable |

Shop SKU row: 24px `itemInner` + `skuLabel` + ` $price`. Armed place on that SKU = selected.

List only `skuShown` rows. Hidden ≠ greyed.

## General store

Left dock title **General store**. Tabs **Seeds** / **Utility** / **Automation**.

| tab | SKUs |
|---|---|
| Seeds | pack-carrot … pack-raspberry |
| Utility | shovel, better-shovel, pickaxe, hardened pickaxe, bucket, large-bucket, box, large-box |
| Automation | pumpjack, chest, grinder |

Strip under the list always visible. No hover → tab line:

| tab | text |
|---|---|
| Seeds | Seeds for the field. |
| Utility | Tools and carry. |
| Automation | Machines you place. |

Hover → `skuDesc` + reason.

## Tabs

Radix `Tabs`. Trigger is a tab, not `Btn`. `forwardRef`. Active: ink underline + `text-ink`. Idle: `text-ink/50`. Shop and Research use this. Do not wrap `Btn` in `Tabs.Trigger asChild`.

## Research

Four tabs: Plants, Utilities, Expansion, Automation. Rows use `.name`. Unlock all stays.

## Almanac

HUD opens centered wide `Frame`. Panel `{ kind:'almanac' }`.

Left: `catalogEntries().map` titles. Right: icon + title + `blurb`. Locked still listed.

## Lenses

HUD **Lens** toggles a dropdown. Button label is **Lens**, or **Lens · {name}** when a filter is on. Never **Off** on the button.

Click outside or pick a row → close.

Rows: **None**, **Water need**, **Ripeness**, **Object type**.

View-local `Lens`. Relevant tints: `mix-blend-mode: multiply`, opacity **0.72**. Tokens `lens-bad` `#e23b2e` / `lens-good` `#2fd15a` / `lens-done` `#1e9be6`. Mid lerp via `ripe` so the scale does not go olive.

| lens | tiles | color |
|---|---|---|
| water | growing, ripe | `thirst===1` → `lens-done`. Else scale `lens-bad` → `ripe` → `lens-good` on thirst. |
| ripe | growing, ripe, dead | growing: same scale on maturity. ripe = `lens-done`. dead = `lens-bad`. |
| kind | see table | plant `leaf`, machine `water`, obstruction `ink`, building `roof` |

Dropdown swatches use `bg-lens-bad` / `bg-lens-good` / `bg-lens-done`.

Irrelevant cells: wash `house` at 0.35. Relevant cells use the scale at 0.72 + multiply.

## Almanac

Centered `Frame`/`Chrome`, `w-[36rem]`, `max-h-[min(36rem,calc(100%-6rem))]`. Left list `overflow-y-auto`. Compact rows (icon 16px + title), not `Btn` slabs. Right pane scrolls the blurb. Overlay `bg-ink/40`.

## Expand

Not raw text. Plate ~0.85 tile at `face.at`. Copy **Expand $N**. `fill-house` `text-ink`. Poor: muted dirt-dark, hover look **Cannot afford**. After `unlock-expand` only.

## Speech

Bubble above actor. `bg-house` `text-ink`. Pointer-events none. Hidden when `speech.kind === 'none'`.

## Wilt

Growing + `thirst < WITHER`: thirst bar `animate-pulse`. Look omits “growing” ([[mechanics/beta-4]]).

## Inventory / chest

House: 16, unchanged.

`cue.kind === 'chest'`: 3×3 dialog, same swap/slot chrome, title **Chest**. `ackCue` on close.

## Place

[[ui/place]]. Chest / grinder: 1-tile 64px ghost + **Place Chest** / **Place Seed grinder**.

## Copy

| item | line |
|---|---|
| box empty | Fruit box - empty / Large fruit box - empty |
| box cargo | Fruit box - … |
| fruit / berry | `{name} - {count}, sell for ${n}` |

Look:

| cell | line |
|---|---|
| chest | Chest |
| grinder | Seed grinder |
| infertile prompt | does not need seeds |
| growing wilt | `{Crop} - water {n}%` |

Prompt extras:

| when | text |
|---|---|
| chest | Chest |
| grinder + fruit or fruit-box-of-fruit | Grind |
| grinder else | speech on click; hover may stay blocked |
| infertile | does not need seeds |
| shovel + any shrub | Dig |
