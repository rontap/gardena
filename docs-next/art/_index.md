# Art

How the game looks and sounds, and the rules that keep new art consistent with what is there. Every picture is a hand-written SVG in `src/assets/`; every song is a score in `sim/feature-sound/music/`. Where a file is drawn and how it reaches the screen is in [[systems/view]]; how sound is played is in [[systems/sound]]. The art for one building, crop or item is listed on its page in [[items/_index|items]].

| page | covers |
|---|---|
| [[art/svg]] | file rules, the tile grid, groups, the atlas, drawing rules, and the look of each kind of asset |
| [[art/palette]] | every colour an asset or panel may use |
| [[art/vfx]] | animated effects on the map: working machines, bursts, flow along pipes and wires |
| [[art/variants]] | art that varies by tile or by crop variety: ground, tilled edges, rocks, burrows, variety faces |
| [[art/music]] | musical direction, the songs, and the developer's preferences |

Checking art: `#atlas` shows every atlas texture ([[systems/debug-pages]]). `atlas.test.ts` checks that each file carries exactly the groups the code asks for.
