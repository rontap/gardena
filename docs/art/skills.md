# Family & skills art

`src/assets/skills/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold.

## Portraits

`portrait-player.svg` `portrait-husband.svg` `portrait-daughter.svg` — viewBox `0 0 64 96`, one per Family panel
column, no groups. Bust plus a background naming the aspect: field and sky, study wall, market awning.

Anatomy, not blobs. Cranium ellipse tapering into a jaw and chin; a straight neck column flaring into the
trapezius; shoulders sloping to the deltoid then dropping straight. **The arm edge starts at the armpit**, about
eighteen rows below the shoulder line, fifteen on the child — low, roughly two thirds down the visible torso — and
runs to the bottom crop as ink plus a two-pixel contact shadow, with the ribcage nine pixels narrower per side
than the shoulder span. The shoulder cap stays unbroken: arm and torso are
one mass where they join, and an edge carried up over the shoulder reads as a limb stuck on.

Face: eyes are 6×4, mirrored so the inner corner faces the nose — ink lash cap, shaded iris row with a glint, lit
iris row around a 2×1 pupil, cream only in the corners. Eyes land on the half-height of the skull, about one
eye-width apart. Nose base to mouth is **one** row; mouth to chin three or four. Brows sit two rows clear of the
lash cap on visible forehead. No loose `dirt` pixels on the cheeks — at this scale they read as scars.

You: straw hat, braids, overalls, `water` eyes. Husband: brown-blonde side part, cream shirt with **horizontal**
`water` stripes, `leaf` eyes, no glasses. Daughter: pigtails, `fruit-red` bow, `roof` dress, cream pinafore, her
father's eyes — same girl as in `ui-market-stall.svg`.

## Button

`ui-btn-family.svg` — groups `idle` `hover` `selected` `disabled`, frame language of
`ui-btn-research.svg`, select with `btnFace`. Three heads: husband left, you centre, daughter right.

## Skill icons

No groups, one per skill family — every tier reuses it, the UI draws the level.

Live: `skill-boots` `skill-driving-classes` `skill-machinery` `skill-tending` `skill-seed-bank` `skill-forecast` `skill-saleswoman` `skill-broker` `skill-heirloom` `skill-better` `skill-industrial` `skill-jam` `skill-lucky` · `skill-point` (unspent point) `skill-locked` (research or skill gate).

Skill svg files remain on disk; not live. They are not in this list.

## Standing icons

`stat-reputation.svg` `stat-luck.svg` — the Family standing band, not a skill — [[ui/family]]. Drawn shapes, **not** a glyph inside a badge: the badge form is what a skill chip wears, and these two are the farm's standing.

`stat-reputation` is a five-point star filling the box: `ink` outline, `ripe` body, a `dirt` inner rim for depth, a two-pixel `house` glint on the upper-left arm — the same four tones and the same order as the coin inside `skill-lucky`.

`stat-luck` is a four-leaf clover: four lobes, each a disc with the outer corner notched, `ink` seams down and across the middle so the four read as four, `leaf` body, and a `grass-dark` stem leaving the centre and bending right below the leaves. Copied into `skill-lucky`, not redrawn.

Both are scanline `rect` rows like `ui-cursor.svg`, not paths.

## Reuse, not redraw

One copy of each shared symbol; icons composite it.

- **Better {crop}** — `skill-better.svg` is the arrow badge alone. The UI draws `fruitInner(crop)` under it. No
  per-crop file.
- **Arrows** — up / down badge in the `ui-quality.svg` language: ink square, solid `leaf` fill, ink glyph cut out.
- **Őstermelő** — `skill-heirloom.svg` is `ui-quality.svg` at 3× in heirloom gold. Not a new symbol.
- **Money** — every coin is `ui-coin.svg` embedded verbatim under a `translate` (and `scale(2)` in
  `skill-saleswoman`). If `ui-coin.svg` or `ui-quality.svg` changes, re-copy into live money icons
  `skill-saleswoman` `skill-heirloom`.
- **Lucky** — `skill-lucky.svg` is the `stat-luck.svg` four-leaf clover, no coin. All three `lucky` skills draw it. Do not redraw the Coin.
