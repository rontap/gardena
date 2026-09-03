# Callout hover

`CalloutHover` in `src/game/ui/callout-hover.tsx`. Chrome card, same rails as a main window. `w-64`. Title in `font-display` `text-xs`, then description `text-sm` `text-ink/75`, `whitespace-pre-line`.

```
placement: 'right' | 'below'
```

Default `'right'`. `pointer-events-none`. Does not move the host.

| placement | class |
|---|---|
| `right` | `absolute top-0 left-full z-30 ml-2` |
| `below` | `absolute top-full right-0 z-30 mt-2` — no `left-full` |

`description` is a `ReactNode`, not a string. Panels pass a fragment: the blurb, then — when the thing is blocked — a `mt-2 block font-bold text-roof` line saying **why**. That reason line is the contract: any disabled control that has a callout must explain itself there rather than just going gray.

Host:

- [[ui/family]] — wrap around the Family `Chrome`. `right`.
- Shop / Research — `Dock` `aside`. `right`.
- Market Overlay `aside` — board offer + active cancel. `right`. [[ui/contracts]] [[ui/market]]
- Almanac Overlay `aside` — Ingredients yield plate. `right`. Title `faceName`. Body: `Coin` of baked `unitSale`, then that recipe. [[ui/almanac]] [[ui/recipe]]
- `#debug-contracts` Chrome `aside`. `right`. Host OfferCard, not guest-dead. [[ui/cheat]]
- Top-ribbon expand / points chips. `below`. Host is the chip (`relative`). Not Overlay. Not a `Panel`. [[ui/hud]]
- Top-ribbon weather glyphs. `below`. Host is the glyph (`relative`). Current title/body locked on [[mechanics/weather]]. Tomorrow title **Tomorrow · {name}**, body of that kind. [[ui/hud]]

Hover sets the tip, leave clears it. Hosts hold `{ title, description, why? }` and render `why` as the roof line.

Blocked controls use `aria-disabled` + a guarded `onClick`, never the `disabled` attribute — a disabled button dispatches no pointer events and would silently kill its own explanation.

Not used for held-item inspect.