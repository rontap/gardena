import { HAPPY_START, type Rarity } from '../defs/rarity.ts'
import type { CropId } from './ids.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'

export type Doom = 'wilt' | 'drown' | 'starve'

export class Plant {
  maturity = 0
  freshness = 1
  happiness = HAPPY_START
  bio = true
  tended = false

  readonly crop: CropId
  rarity: Rarity

  constructor(crop: CropId, rarity: Rarity) {
    this.crop = crop
    this.rarity = rarity
  }

  stats(mods: readonly Modifier[]): Stats {
    return statsOf(this.crop, this.rarity, mods)
  }

  stage(kind: 'growing' | 'ripe' | 'dead'): 'sprout' | 'grow' | 'ripe' | 'dead' {
    if (kind === 'dead') return 'dead'
    if (kind === 'ripe') return 'ripe'
    if (this.maturity < 0.33) return 'sprout'
    return 'grow'
  }
}

export class Turf {
  maturity = 0

  readonly variant: 0 | 1 | 2

  constructor(variant: 0 | 1 | 2) {
    this.variant = variant
  }

  stage(): 'sprout' | 'grow' {
    return this.maturity < 0.5 ? 'sprout' : 'grow'
  }
}

export class Weed {
  maturity = 0

  readonly variant: 0 | 1

  constructor(variant: 0 | 1) {
    this.variant = variant
  }

  stage(): 'sprout' | 'grow' {
    return this.maturity < 0.4 ? 'sprout' : 'grow'
  }
}
