# Family

HUD panel + `World` fields. Not XP. No Family class. Rules: [[mechanics/family]]. Chrome: [[ui/family]]. Art: [[art/skills]].

Ids: `sim/ids.ts`. Table: `defs/skills.ts`. Offers, pick, and skill-modifier rebuild live in `sim/family.ts`: `initFamily` `rerollOffers` `skillEligible` `pickSkillBody` `rebuildSkillModifiers` `unlockAllSkillsBody`. State stays `World.family` / `World.points`. New-farm constructor calls `initFamily(this)` after `family` exists. Hydrate rebuilds modifiers; it does not reroll. Chrome: `ui/family.tsx` (panel), `ui/recap.tsx` (App `recapDay` popup).

Illegal: `better-carrot` `better-vanilla` `better-sugar-cane`. Illegal: player owns `saleswoman` — owned maps are per member, each id set closed. Illegal: player `machinery`. Illegal: husband `contracts` `tool-contracts` `machine-contracts` `bulk-buying`. Illegal: optional `Family`. Illegal: `recipient?: MemberId` on `Recap`. Illegal: tier 0. Illegal: tier > `maxTier`.

`BetterCrop` = potato | wheat | tomato | raspberry | grape | apple | apricot | olive | cherry. `BETTER_IDS` complete `{ [K in BetterCrop]: PlayerSkillId }`. Tree `better-*` is legal.

`SKILLS` in `defs/skills.ts`. Not on `World`. `SkillEffect` `{ kind: 'haggling' }` `{ kind: 'broker' }` `{ kind: 'industrial' }` `{ kind: 'machine' }` `{ kind: 'forecast' }` `{ kind: 'lucky' }` `{ kind: 'better'; crop: CropId; saleMul }`. No `{ kind: 'dummy' }`. Arms live in `SKILLS`.

Type `Family` on `world.ts`. Field `World.family`. Always present. Shared `World.points`. Per member: `pickCount`, `owned`, `offers`. Missing owned key = not owned. `offers` length 0..3.

`Act.cheat` `{ k: 'skills' }` is `unlockAllSkills`. Recap Close is `World.seeRecap(day)` — not a `Cmd`, not a grant. `banner = 4` is the seam.
