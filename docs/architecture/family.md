# Family

HUD panel + `World` fields. Not XP. No Family class. Rules: [[mechanics/family]]. Chrome: [[ui/family]]. Art: [[art/skills]].

Ids: `sim/ids.ts`. Table: `defs/skills.ts`. Pick and skill-modifier rebuild live in `sim/family.ts`: `initFamily` `skillKnown` `skillOpen` `pickSkillBody` `rebuildSkillModifiers` `unlockAllSkillsBody`. State stays `World.family` / `World.points`. New-farm constructor calls `initFamily(this)` after `family` exists. Hydrate rebuilds modifiers. Chrome: `ui/family.tsx` (panel), `ui/recap.tsx` (App `recapDay` popup).

Illegal: `better-carrot` `better-vanilla` `better-sugar-cane`. Illegal: `better-apple` `better-apricot` `better-olive` `better-cherry`. Illegal: `forecast` `lucky-husband` `lucky-daughter`. Illegal: `PlayerSkillId` `HusbandSkillId` `DaughterSkillId` as owners. Illegal: player owns a member map. Illegal: `offers`. Illegal: `pickCount`. Illegal: optional `Family`. Illegal: `recipient?: MemberId` on `Recap`. Illegal: tier 0. Illegal: tier > `maxTier`. Illegal: `{ kind: 'forecast' }`. Illegal: `{ kind: 'dummy' }`.

`BetterCrop` = potato | wheat | tomato | raspberry | grape. `BETTER_IDS` complete `{ [K in BetterCrop]: SkillId }`. No tree `better-*`.

`SKILLS` in `defs/skills.ts`. Not on `World`. No `member` on `SkillDef`.

```
SkillId =
  | 'boots' | 'tending' | 'seed-bank'
  | 'better-wheat' | 'better-potato' | 'better-tomato' | 'better-grape' | 'better-raspberry'
  | 'grafting' | 'lucky'
  | 'bulk-up' | 'driving-classes' | 'machinery' | 'industrial' | 'inherit-land'
  | 'saleswoman' | 'jam' | 'heirloom' | 'specialty' | 'broker'

SkillGate =
  | { kind: 'none' }
  | { kind: 'research'; id: ResearchId }

SkillEffect =
  | { kind: 'walk'; mul: 1.05 }
  | { kind: 'bulk-up' }
  | { kind: 'driving-classes' }
  | { kind: 'machine'; mul: 1.05 }
  | { kind: 'tend' }
  | { kind: 'broker' }
  | { kind: 'industrial' }
  | { kind: 'inherit-land' }
  | { kind: 'saleswoman'; mul: 1.02 }
  | { kind: 'heirloom'; mul: 1.05 }
  | { kind: 'specialty'; mul: 1.05 }
  | { kind: 'better'; crop: CropId; saleMul }
  | { kind: 'jam' }
  | { kind: 'grafting' }
  | { kind: 'lucky' }
  | { kind: 'seed-bank' }

SkillDef = {
  id: SkillId
  name: string
  blurb: string
  maxTier: number
  parent: SkillId | null
  gate: SkillGate
  effect: SkillEffect
}

Family = { owned: Map<SkillId, number> }
```

| field | is |
|---|---|
| `World.family` | always present |
| `World.points` | shared bank |
| `family.owned` | missing key = not owned |
| `SKILLS[id].parent` | `null` = start |
| `SKILLS[id].gate` | extra research lock |
| `Act.pickSkill` | `{ id: SkillId }` |

`Act.cheat` `{ k: 'skills' }` is `unlockAllSkills`. Recap Close is `World.seeRecap(day)` — not a `Cmd`, not a grant. `banner = 4` is the seam.

Dump is this shape only. No save aliases. No merge of an old member dump. No folding dropped skill ids. An old dump that does not match fails hydrate — [[architecture/save]].
