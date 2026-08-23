# Type

One scale, one body face. Set in `src/index.css` under `@theme`. Do not hand-roll a size.

| token | px | use |
|---|---|---|
| `text-xs` | 11 | badges, counts, swatch legends, `Label` eyebrows, chip tiers |
| `text-sm` | 13 | secondary and meta: tab labels, stat rows, blurbs, footers, queue, shop card labels and their price |
| `text-base` | 15 | body default, row labels, buttons |
| `text-lg` | 17 | money in the top ribbon, close glyph |
| `text-xl` / `text-2xl` / `text-3xl` | 20 / 24 / 28 | reserved |

Faces:

- `--font-display` **Press Start 2P**. Window titles, the **Gardena** wordmark, family member names, dash fuel and speed readouts, tractor hitch `{used}/100`. Nothing else. Never body copy — it does not wrap or scan.
- `--font-body` **Nunito**, set on `html, body, #root`. Everything else. Weights 400 / 600 / 700; `font-semibold` carries emphasis, colour opacity (`text-ink/55`, `/45`) carries de-emphasis.

Display text sits one or two steps *below* the body size it heads — `text-sm` Press Start 2P reads larger than `text-base` Nunito.

Numbers that update in place get `tabular-nums`.

`Label` (`frame.tsx`) is the section eyebrow: `text-xs`, bold, `tracking-[0.14em]`, uppercase, `text-ink/45`.

## Scroll

Any pane that can overflow gets `scroll-pane` — 6px, `dirt` thumb, `ink/12` track. `Window` applies it to its body. Panels should be sized so the common case does not scroll at 1440×900; the styled bar is for the long tail, not the default.
