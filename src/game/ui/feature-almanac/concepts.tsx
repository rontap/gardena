import { m } from '../../../paraglide/messages.js'
import { Fragment } from 'react'
import {
  AGARIC_LOOT_COUNT,
  BURROW_ENTRIES,
  BURROW_RARE_STEP,
  BURROW_RARITIES,
  BURROW_START_N,
  TRUFFLE_LOOT_COUNT,
  WEED_LOOT_COUNT,
  type BurrowEntry,
  type BurrowRarity,
} from '../../defs/burrow.ts'
import { INFUSE_REAGENTS, MILL_TRUFFLE_OUT } from '../../defs/items.ts'
import {
  MUSHROOM_CHANCE,
  MUSHROOM_DAYS,
  MUSHROOM_HAPPY_MAX,
  MUSHROOM_HAPPY_MIN,
  MUSHROOM_MYCOLOGIST,
  MUSHROOM_TRUFFLE,
} from '../../defs/mushroom.ts'
import { HARDNESS, type Rules } from '../../defs/rules.ts'
import { JAM_ROT, SKILLS } from '../../defs/skills.ts'
import { tierOf, VARIETY_TIERS } from '../../defs/varieties.ts'
import { WEATHER_KINDS, WEATHER_NAME } from '../../defs/weather.ts'
import { toolItem } from '../../sim/feature-burrow/burrow.ts'
import { INFUSABLE_KINDS } from '../../sim/ids.ts'
import { faceName, infuseGoodsText, REAGENT_NAME, tierLabel, type Face } from '../../sim/item.ts'
import { EXPAND_LAND, itemInner, SKILL_POINT } from '../../view/svgs.ts'
import { useCycle } from '../cycle.ts'
import { Coin, Label } from '../frame.tsx'
import { BLUE, BROWN, Portrait } from './cards.tsx'
import { AlmanacLink, CONCEPT_LABEL, type ConceptId } from './nav.tsx'

export function ConceptPane({ id, rules }: { id: ConceptId; rules: Rules }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{CONCEPT_LABEL[id]()}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{conceptBody(id, rules)}</div>
    </>
  )
}

function conceptBody(id: ConceptId, rules: Rules) {
  switch (id) {
    case 'variety':
      return <VarietyConcept />
    case 'quality':
      return <QualityConcept />
    case 'freshness':
      return <FreshnessConcept rules={rules} />
    case 'happiness':
      return <HappinessConcept />
    case 'day':
      return <DayConcept />
    case 'market':
      return <MarketConcept />
    case 'skills':
      return <SkillsConcept />
    case 'family':
      return <FamilyConcept />
    case 'research':
      return <ResearchConcept />
    case 'burrow':
      return <BurrowConcept />
    case 'mushrooms':
      return <MushroomsConcept />
    case 'infusion':
      return <InfusionConcept />
  }
}

function VarietyConcept() {
  return (
    <>
      <div>{m.almanac_variety_p1()}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function QualityConcept() {
  return (
    <>
      <div>{m.almanac_quality_p1()}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function FreshnessConcept({ rules }: { rules: Rules }) {
  const full = Math.round(HARDNESS[rules.difficulty].freshFull * 100)
  return (
    <>
      <div>
        {m.almanac_fresh_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p1_b()}
      </div>
      <div>
        {m.almanac_fresh_p2_a()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_fresh_p2_b()}
        <AlmanacLink to={{ tab: 'utility', id: 'chest' }}>{m.names_building_chest()}</AlmanacLink>
        {m.almanac_fresh_p2_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_fresh_p2_d()}
        <AlmanacLink to={{ tab: 'utility', id: 'freezer' }}>{m.names_building_freezer()}</AlmanacLink>
        {m.almanac_fresh_p2_e()}
        <AlmanacLink to={{ tab: 'utility', id: 'sugar' }}>{m.names_item_sugar()}</AlmanacLink>
        {m.almanac_fresh_p2_f()}
      </div>
      <div>
        {m.almanac_fresh_p3_a({ full })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_c({ full })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.jam.name}</AlmanacLink>
        {m.almanac_fresh_p3_e({ i: JAM_ROT * 100, ii: JAM_ROT * 200, iii: JAM_ROT * 300 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_rotten()}
        <Coin n={1} />
        {m.almanac_fresh_p3_g()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_and_word()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_fresh_p4_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_fresh_p4_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_fresh_p4_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_fresh_p4_d()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function HappinessConcept() {
  return (
    <>
      <div>{m.almanac_happy_p1()}</div>
      <div>
        {m.almanac_happy_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_happy_p2_b()}
      </div>
      <div>
        {m.almanac_happy_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.tending.name}</AlmanacLink>
        {m.almanac_happy_p3_b()}
      </div>
      <div>
        {m.almanac_happy_p4_a()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_dead_plant()}</AlmanacLink>
        {m.almanac_happy_p4_b()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_happy_p4_c()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_dead_plant()}</AlmanacLink>
        {m.almanac_happy_p4_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_loses_freshness()}</AlmanacLink>
        {m.almanac_happy_p4_e()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.almanac_crop_skills_family_cap()}</AlmanacLink>
        {m.almanac_happy_p5_a()}
      </div>
      <div>
        {m.almanac_happy_p6_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'sensor-water' }}>{m.names_sensor_water()}</AlmanacLink>
        {m.almanac_happy_p6_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_happy_p6_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function DayConcept() {
  return (
    <>
      <div>{m.almanac_day_p1()}</div>
      <div>
        {m.almanac_day_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.almanac_word_research()}</AlmanacLink>
        {m.almanac_day_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_player()}</AlmanacLink>
        {m.almanac_day_p2_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_husband()}</AlmanacLink>
        {m.almanac_day_p2_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_daughter()}</AlmanacLink>
        {m.almanac_day_p2_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_skill_point()}</AlmanacLink>
        {m.almanac_day_p2_f()}
      </div>
      <div>
        {m.almanac_day_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_day_p3_hours()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_day_p3_open()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function MarketConcept() {
  return (
    <>
      <div>{m.almanac_market_p1()}</div>
      <div>
        {m.almanac_market_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_market_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_market_p2_c()}
      </div>
      <div>
        {m.almanac_market_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_market_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.saleswoman.name}</AlmanacLink>
        {m.almanac_market_p3_c({ saleswoman: 2 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.heirloom.name}</AlmanacLink>
        {m.almanac_market_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_market_p3_e({ heirloom: 5 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.jam.name}</AlmanacLink>
        {m.almanac_market_p3_g({ jam: JAM_ROT * 100 })}
        {m.almanac_market_p3_rotten_a()}
        <Coin n={1} />
        {m.almanac_market_p3_rotten_b()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_concept_day()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function SkillsConcept() {
  return (
    <>
      <div>
        {m.almanac_skills_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_skills_p1_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_end_of_day()}</AlmanacLink>
        {m.almanac_skills_p1_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_skills_p1_d()}
      </div>
      <div>
        {m.almanac_skills_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_happier_plants()}</AlmanacLink>
        {m.almanac_skills_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_skills_p2_c()}
        <Coin n={1} />
        {m.almanac_skills_p2_d()}
        <Coin n={1} />
        {m.almanac_skills_p2_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_skills_p2_f()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_skills_p2_g()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_concept_day()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function FamilyConcept() {
  return (
    <>
      <div>
        {m.almanac_family_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_family_p1_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_family_p1_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.almanac_word_research()}</AlmanacLink>
        {m.almanac_family_p1_f()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_g()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_skill_points()}</AlmanacLink>
        {m.almanac_family_p1_h()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_family_p1_i()}
      </div>
      <div>
        {m.almanac_family_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_family_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function ResearchConcept() {
  return (
    <>
      <div>{m.almanac_research_p1()}</div>
      <div>{m.almanac_research_p2()}</div>
      <div>
        {m.almanac_research_p3_a()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.almanac_word_machines()}</AlmanacLink>
        {m.almanac_research_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_research_p3_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_research_p3_d()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function BurrowConcept() {
  return (
    <>
      <div>{m.almanac_burrow_p1()}</div>
      <div>{m.almanac_burrow_p2({ start: BURROW_START_N })}</div>
      <div>{m.almanac_burrow_p3({ step: BURROW_RARE_STEP })}</div>
      <BurrowCard />
    </>
  )
}

const RARITY_NAME: { readonly [K in BurrowRarity]: () => string } = {
  common: () => m.names_rarity_common(),
  uncommon: () => m.names_rarity_uncommon(),
  rare: () => m.names_rarity_rare(),
}

type EntryCard = { caption: string; arts: readonly string[]; fill: string }

const ENTRY_SLOT: { readonly [K in BurrowEntry['kind']]: { order: number; fill: string } } = {
  seeds: { order: 0, fill: BROWN },
  'tree-seed': { order: 1, fill: BROWN },
  weed: { order: 2, fill: BROWN },
  'fly-agaric': { order: 2, fill: BROWN },
  truffle: { order: 2, fill: BROWN },
  treasure: { order: 3, fill: BLUE },
  permit: { order: 3, fill: BLUE },
  tool: { order: 4, fill: BLUE },
  'special-tool': { order: 4, fill: BLUE },
  'skill-point': { order: 4, fill: BLUE },
}

function oneCard(face: Face, fill: string): EntryCard {
  return { caption: faceName(face), arts: [itemInner(face)], fill }
}

function entryCard(entry: BurrowEntry): EntryCard {
  const fill = ENTRY_SLOT[entry.kind].fill
  switch (entry.kind) {
    case 'treasure':
      return {
        caption: m.almanac_caption_treasure({ min: entry.min, max: entry.max }),
        arts: [itemInner({ kind: 'treasure', coins: entry.min })],
        fill,
      }
    case 'seeds':
      return {
        caption: m.almanac_caption_seeds({ tier: tierLabel(tierOf(entry.pool[0].variety)) }),
        arts: entry.pool.map(p => itemInner({ kind: 'seeds', crop: p.crop, variety: p.variety, quality: 0, count: entry.count })),
        fill,
      }
    case 'tree-seed':
      return {
        caption: m.almanac_caption_tree_seed({ tier: tierLabel(tierOf(entry.pool[0].variety)) }),
        arts: entry.pool.map(p => itemInner({ kind: 'tree-seed', tree: p.tree, variety: p.variety, quality: 0 })),
        fill,
      }
    case 'weed':
      return oneCard({ kind: 'weed', count: WEED_LOOT_COUNT }, fill)
    case 'fly-agaric':
      return oneCard({ kind: 'fly-agaric', count: AGARIC_LOOT_COUNT }, fill)
    case 'truffle':
      return oneCard({ kind: 'truffle', count: TRUFFLE_LOOT_COUNT }, fill)
    case 'skill-point':
      return { caption: m.almanac_caption_skill_point(), arts: [SKILL_POINT], fill }
    case 'tool':
    case 'special-tool':
      return { caption: m.almanac_caption_tool(), arts: entry.pool.map(tool => itemInner(toolItem(tool, uses => uses))), fill }
    case 'permit':
      return { caption: m.market_expansion_permit(), arts: [EXPAND_LAND], fill }
  }
}

function BurrowCard() {
  return (
    <div className="flex flex-col gap-3">
      {BURROW_RARITIES.map(rarity => (
        <div key={rarity} className="w-fit rounded-lg border-2 border-ink/25 px-2 pb-2">
          <Label>{RARITY_NAME[rarity]()}</Label>
          <div className="flex gap-2">
            {BURROW_ENTRIES[rarity]
              .toSorted((a, b) => ENTRY_SLOT[a.kind].order - ENTRY_SLOT[b.kind].order)
              .map((entry, i) => (
                <EntryPortrait key={i} card={entryCard(entry)} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryPortrait({ card }: { card: EntryCard }) {
  const art = card.arts[useCycle(card.arts.length)]
  return (
    <Portrait caption={card.caption} fill={card.fill}>
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: art }} />
    </Portrait>
  )
}

function ShareGrid({ rows }: { rows: readonly { key: string; label: string; share: number }[] }) {
  return (
    <div className="grid w-fit grid-cols-[auto_auto] gap-x-6">
      {rows.map(r => (
        <Fragment key={r.key}>
          <div>{r.label}</div>
          <div className="text-right">{m.almanac_pct({ n: Math.round(r.share * 100) })}</div>
        </Fragment>
      ))}
    </div>
  )
}

function MushroomsConcept() {
  return (
    <>
      <div>{m.almanac_mushrooms_p1()}</div>
      <div className="flex gap-2">
        <EntryPortrait card={oneCard({ kind: 'fly-agaric', count: 1 }, BROWN)} />
        <EntryPortrait card={oneCard({ kind: 'truffle', count: 1 }, BROWN)} />
      </div>
      <div>{m.almanac_mushrooms_p2({ skill: SKILLS.mycologist.name })}</div>
      <div className="grid w-fit grid-cols-[auto_auto_auto] gap-x-6">
        {WEATHER_KINDS.map(k => (
          <Fragment key={k}>
            <div>{WEATHER_NAME[k]()}</div>
            <div className="text-right">{m.almanac_pct({ n: Math.round(MUSHROOM_CHANCE[k] * 100) })}</div>
            <div className="text-right">{m.almanac_mushrooms_rank({ n: Math.round(MUSHROOM_MYCOLOGIST[k] * 100) })}</div>
          </Fragment>
        ))}
      </div>
      <div>{m.almanac_mushrooms_happy({ max: MUSHROOM_HAPPY_MAX, min: MUSHROOM_HAPPY_MIN })}</div>
      <div>{m.almanac_mushrooms_p3()}</div>
      <ShareGrid rows={VARIETY_TIERS.map(t => ({ key: t, label: tierLabel(t), share: MUSHROOM_TRUFFLE[t] }))} />
      <div>{m.almanac_mushrooms_p4({ days: MUSHROOM_DAYS })}</div>
      <div>{m.almanac_mushrooms_p5({ n: MILL_TRUFFLE_OUT })}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'infusion' }}>{m.almanac_concept_infusion()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'burrow' }}>{m.almanac_concept_burrow()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function InfusionConcept() {
  return (
    <>
      <div>{m.almanac_infusion_p1()}</div>
      <div className="grid w-fit grid-cols-[auto_auto] gap-x-6">
        {INFUSABLE_KINDS.map(k => {
          const [first, second] = INFUSE_REAGENTS[k]
          return (
            <Fragment key={k}>
              <div className="first-letter:uppercase">{infuseGoodsText([k], 'conjunction')}</div>
              <div>{m.almanac_infuse_row({ first: REAGENT_NAME[first](), second: REAGENT_NAME[second]() })}</div>
            </Fragment>
          )
        })}
      </div>
      <div>
        {m.almanac_infusion_p2()}{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'mushrooms' }}>{m.almanac_concept_mushrooms()}</AlmanacLink>
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}
