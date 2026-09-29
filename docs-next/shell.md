# The screen

Code: `App.tsx`, `game/ui/hud.tsx`, `game/ui/frame.tsx`, `game/ui/panel.ts`, `game/ui/notices.ts(x)`, `game/ui/status.tsx`, `game/ui/queue.tsx`, `game/view/map.tsx`; see [[code-map]].

The UI around the farm map: the rails, the panels, pausing, the Command Center, the inspect column and keyboard input. Each feature page describes the content of its own panel; this page describes the layout and the behaviour shared by all panels.

## Layout

- **Top rail** (`Hud`, full width at the top): **Gardena**, money, the day and phase (**Day {n} · {phase}**) with a bar for the time of day, today's weather, tomorrow's weather once the forecast is unlocked (`forecastCount`), frame rate and memory readouts, the multiplayer status chip, and the buttons **Multiplayer**, **Almanac**, **Cheat** (not shown to a guest), **Pause** / **Resume** and **Gear**.
- **Left rail** (`Hud`, below the top rail): **Build**, **Research**, **Market**, **Contracts** (after `unlock-contracts`), **Vehicle automation** (after `unlock-dispatch`), **Lens**, **Family**. While Build is open or a Build tool is selected: **Demolish**, **Rotate** (only for rotatable SKUs, `ROTATABLE`) and **Cancel** (only while a tool is selected).
- **Command Center** (`Notices`): the column at the top right. See below.
- **Job list and inspect** (`Queue`, `Status`): a column at the bottom right. `Queue` shows the local seat's job list; `Status` shows the hovered tile's name line and bars.
- **Map** (`MapView`): the Pixi canvas behind everything.

## Panels

`App` holds one open panel at a time (`Panel` in `panel.ts`). Opening one closes the previous one.

| panel | component wrapper | opened by | pauses solo game |
|---|---|---|---|
| Build, Market, Cheat, Lens | `Dock`, next to the left rail | left rail / top rail button | no |
| Research, Family | `TreePanel` | left rail button | no |
| Contracts, Almanac | `Overlay`, centred over a dark backdrop | left rail / top rail button | yes |
| Gear menu | `Chrome` | **Gear** | yes |
| Inventory, chest, freezer, postbox | `Dialog` | walking up to the house or the building | no |
| Seed silo, Additive store, hangar, research station, Necronomicon, vehicle | own component | walking up to the building or vehicle | no |
| Multiplayer | own dialog | **Multiplayer** | yes, for host and solo |
| end-of-day summary | popup | its Command Center row | yes |

Pausing on open only applies to solo play (`overlayPause` checks `role === 'off'`). If the game was already paused when the panel opened, closing the panel leaves it paused. The Multiplayer dialog pauses a host's session for every player (`host.setPaused`).

Panels opened by walking up to a building (`cued`) clear the seat's walk-up state (`ackCue`) when closed.

With **Pause when this tab is not in front** on ([[menu]]), losing window focus or hiding the tab pauses a solo game, and returning resumes it if the pause came from that.

## Command Center

One-line rows in the top-right column (`noticeRows` in `notices.ts`, rendered by `notices.tsx`). `noticeRows(world)` reads `World` and writes nothing; it runs every `NOTICE_SECONDS`. A condition must hold on two consecutive runs before its row appears; event rows (end-of-day summary, contract or research completed, a player joined or left) appear at once.

Row kinds, in `NOTICE_ORDER`: end-of-day summary, tutorial step, players joining and leaving, contract completed, research completed, grandma letter, then losses (wilting, drowning, starving, freshness, dead plant, rotten produce, weeds, empty fuel), running timers (contracts, research, low water network), and things to spend (Necronomicon page ready, skill points, expansion permits). Rows of one kind are grouped in one block, up to `NOTICE_GROUP_MAX`, then **and {n} more**.

Hovering a row outlines its tiles on the map. Left click runs the row's action (open Market, Research or Family, or the popup); right-click dismisses it. A dismissed row whose condition still holds appears again after two runs. Only red ranges produce plant rows. **Hide** moves the column off the right edge.

## Inspect and hover

`Status` shows, for the hovered tile: the name line from `lookText` (crop and variety, building name and state, sensor on or off, what the plot is waiting for), and bars from `status.tsx` (Growth, Happiness, Water, Fertilizer for a growing plant; Quality and Freshness for a ripe plot or fruit; Weed resistance for an empty plot). The hover line uses the same `readPrompt` result as a click ([[systems/commands]]). Hovering a Build card or a disabled control shows its detail in the right-hand callout (`callout-hover.tsx`).

## Lens

A lens colours the map by one property: `water` (**Water need**), `land` (**Land quality**), `ripe` (**Ripeness**), `kind` (**Object type**), `variety`, `pipes` (**Pipes**), `sensors`, `vehicles` (**Vehicle interactions**), or `off`. **Lock view** keeps the lens after its panel closes; the × on the rail button clears it.

## Input

- Left click on the map: `world.click` ([[systems/commands]]). Shift held keeps the Build tool selected after placing.
- Right click on the map: removes a route stop in the route editor; cancels a selected Build tool; with no tool selected and an item in hand, queues a drop on that plot.
- W, A, S, D: walk the gardener (clears the job list), or drive when in a vehicle. Enter: gets out of the vehicle being driven, or into the nearest vehicle on the field that has no driver (`enterBody`).
- Escape: cancels the Build tool, closes the sensor or sprinkler panel, closes the end-of-day summary (marking it read), otherwise closes the open panel.

## Menus

The main menu, the Gear menu, Settings and the version history are on [[menu]].

## Sound

A new Command Center row pushes a `notice` cue, once per row `id`. Pause suspends music and sound effects; the volumes are in Settings ([[systems/sound]], [[menu]]).

## Type and colour

Colour tokens and type steps are defined in `src/index.css` ([[art/palette]]). UI parts (`Chrome`, `Btn`, `Bar`, `Coin`, `Slider`, tab classes) are in `frame.tsx`.

## When you change this

- New panel: add a `Panel` arm, a rail or walk-up entry, a wrapper (`Dock` or `Overlay`), and decide whether it pauses (`overlayHold`) and whether it is a walk-up panel (`cued`).
- New Command Center row: add a `NoticeKind`, its place in `NOTICE_ORDER`, whether it is red (`BAD`), and its string in `notices.json`.
- New key binding: `App.tsx` key handlers; check it does not conflict with walking and driving keys.
