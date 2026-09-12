# Necronomicon

Walk-up panel for the book. Player name **Necronomicon**. Shape [[ui/store]]: Radix dialog + `Frame` `Shell`, `w-[34rem]`. Opened by a walk-up cue, never from the rail. Not a dock. Not ObjectHud. Sacrificing is a world act on the cell, not a control in the panel — the one exception is the money button, because money is not carried.

Rules [[mechanics/necronomicon]] `necro.claim` `necro.ritual` `necro.gold`. Place [[ui/place]]. Look points here from [[ui/inspect]]. Art [[art/machines]]. Type [[ui/type]].

## Cue

`Cue` `|= { kind: 'necronomicon'; at }`. `App.Panel` `|= { kind: 'necronomicon'; at }`. `cued(kind)` covers chest, silo, additives, hangar, vehicle, station, necronomicon. Closing acks.

Walk up holding something a page wants and the prompt is **Sacrifice** — the walk-up dumps and the panel does not open. Walk up with anything else, or empty-handed, and the prompt is **Read the Necronomicon** and the panel opens. Station is the precedent.

Demolish over the book reads **The Necronomicon stays where you put it.** It is not the generic refusal, because a player who cannot move a 2×2 building deserves the reason.

## Panel

Title **Necronomicon**. Then one line saying what the book is for, then the open pages, then the ritual button.

A page is `bg-ink/6 px-3 py-2`:

| part | shows |
|---|---|
| name | `PAGES[id].name`, except `crop` after it locks, which reads **{Crop}, twenty times over** |
| count | **{have} of {want}**, or **Done** once the ritual has closed it |
| blurb | `PAGES[id].blurb`, one sentence saying what to give and how the page behaves |
| bar | `Bar` 0..1, `bg-grape` on `bg-ink/20` |

A closed page stays on the list at `opacity-55`. The player should see what they have already paid, not watch rows vanish.

`early-fruit` draws the six crops instead of a bar: `fruitInner(crop)` at `h-6 w-6`, full colour once given and `opacity-25 grayscale` until then. A bar cannot say *which* crop is still wanted, and that is the whole question on that page.

`supper` draws its three goods the same way, off `SUPPER` order through `itemInner` on a `SUPPER_FACE` row, `book.supper` saying which are given. Same reason: three named goods, and the player needs to see which one is still missing. `agaric` and `tool` keep the bar — one number each, and `tool` reads as empty or full.

Under the list, when any page is still shut: **The book has more pages.** It names no gate — research topology and lock counts both move, and a description that says what opens what is wrong within a version — [[standards/lexicon]] `lex.copy`.

**Money button.** Only while `gold` is open, unclosed and unpaid. Face is the treasure art, label **Sacrifice $666** through `fill`, not digits. Disabled when the farm cannot pay, with **The farm does not have that much.** under it.

**Ritual button.** Full width, `bg-grape`, `text-house`. Disabled outside twilight or with nothing full, and the reason sits under it in `text-ink/55` — a grey control that does not say why is a dead end [[ui/callout-hover]]:

| when | line |
|---|---|
| not twilight | The ritual can only be performed at twilight. |
| nothing full | No page has everything it asked for yet. |

Footer: **Put what a page asks for in your hands and walk up to the book. A chest to the west of the book feeds it for you.** The chest is the only way sixty-six ash is reachable and the panel is where the player is standing when they wonder.

## Letters

The four story beats are a popup, not this panel. `NoticePopup` `|= { kind: 'grandma'; beat }`. `ui/story.tsx`, `Chrome` at `w-[26rem]` with the `ui-recap-night` wash, title in `font-display text-sm`, body in `text-base`, one **Close**. Same chrome as the recap popup, because it arrives the same way and at the same moment of the day.

Close is `World.seeGrandma(beat)`. Not a `Cmd`. Esc and backdrop do the same.

## Command Center

Two rows — [[ui/notices]].

| kind | condition | face | click |
|---|---|---|---|
| `grandma` | `World.grandmaUnseen` holds that beat | `ui-recap-night` | that letter's popup |
| `necronomicon` | `ritualReady` | the book item art | none |

`grandma` skips the two-pass delay: a letter is an event. `necronomicon` does not — a page going full is a condition and the row carries the book's four cells, so hovering it outlines them.

`NOTICE_ORDER` still starts with `recap`; `grandma` closes the one-time group after `research-done`, and `necronomicon` sits with the rows waiting to be spent, above `points`.

Row text is fixed: **A letter is waiting**, **A page is ready for the ritual**. The letter row does not name the beat — four rows that each name a stage of a death read as a list, and the player opens them one at a time anyway.

## Copy

`messages/en/necronomicon.json`, prefix `necro_` — [[architecture/i18n]]. Words are fixed by [[standards/user-facing-text]] and are not open: **Necronomicon**, **page**, **Sacrifice**, **Perform the ritual**, **ritual**, **twilight**, **Done**. Amounts arrive through `fill` from `defs/necronomicon.ts`. Never digits.

The page blurbs say what to give and how that page behaves — the bulk page says the first fruit decides the crop, the six-fruit page says any Variety and any Quality will do. A row that only restated its own name would not be a description.
