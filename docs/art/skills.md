# Family & skills art

New folder: `src/assets/skills/`. Everything else stays [[art/v0.1]] — palette, 24-unit grid,
`shape-rendering="crispEdges"`, no text, no raster, no `currentColor`, no new hex.

## Portraits

`portrait-player.svg` `portrait-husband.svg` `portrait-daughter.svg` — viewBox `0 0 48 72`, 2:3 panel.
One per Family panel column. Bust with a background that names the aspect: field and sky for you,
study wall with bookshelf and chalkboard for your husband, market awning and counter for your daughter.
No groups, no states. Scale with `image-rendering: pixelated`.

- You: straw hat (`ripe` crown, `dirt-dark` band), braids, cream blouse, `dirt-dark` overalls, seedling in the pocket.
- Husband: `dirt-dark` hair, ink glasses, cream shirt, `water` vest, `roof` tie, pencil in the pocket.
- Daughter: `dirt-dark` pigtails, `fruit-red` bow, `roof` dress, cream apron — same girl as the one in `ui-market-stall.svg`.

## Button

`ui-btn-family.svg` — viewBox `0 0 24 24`. Four sibling groups `idle` `hover` `selected` `disabled`,
same frame language as `ui-btn-research.svg`; select by id with `btnFace`. Three heads: husband left,
you centre and tallest, daughter right.

## Skill icons

viewBox `0 0 24 24`, no groups. One icon per skill family — every tier reuses it, the level is drawn by the UI.

| file | skill |
|---|---|
| `skill-boots.svg` | Boots I–V |
| `skill-machinery.svg` | Machinery I–III |
| `skill-tending.svg` | Careful tending |
| `skill-research-speed.svg` | Speedy research I–III |
| `skill-tool-contracts.svg` | Tool contracts I–III |
| `skill-machine-contracts.svg` | Machine contracts I–III |
| `skill-forecast.svg` | Weather forecast |
| `skill-tax.svg` | Smart tax returns I–III |
| `skill-water-study.svg` | Water study lens |
| `skill-land-study.svg` | Land quality study lens |
| `skill-bulk-buying.svg` | Bulk buying |
| `skill-saleswoman.svg` | Saleswoman I–III |
| `skill-heirloom.svg` | Őstermelő I–III |
| `skill-better-{crop}.svg` | Better {crop} — carrot, potato, wheat, tomato, raspberry, watermelon, apple |
| `skill-bio.svg` | Bio farmer I–V |
| `skill-industrial.svg` | Industrial farmer I–V |
| `skill-open-late.svg` | Open late |
| `skill-open-24.svg` | Open 24/7 |
| `skill-jam.svg` | Still good for jam I–V |
| `skill-clearance.svg` | Clearance sale |
| `skill-point.svg` | Unspent skill point pip |
| `skill-locked.svg` | Gated skill, research or skill unlock missing |

`skill-better-{crop}.svg` embeds the `common` group of the matching **`fruit-*.svg`** — the sold fruit,
not `crop-*.svg` — under a green up arrow. Regenerate rather than redraw if fruit art changes.
`skill-open-late` reuses the `ui-phase-sunset` sun, `skill-open-24` the `ui-phase-twilight` moon.

## Do not

Imagine, raster, new hex, text in asset files, redraw the portraits per state, bake a tier number into an icon.
