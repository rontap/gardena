import { CRITICAL, PLANT_THIRST, WITHER } from '../defs/crops.ts'
import { HAPPY_START, type Rarity } from '../defs/rarity.ts'
import type { CropId } from './ids.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'

export class Plant {
  maturity = 0
  thirst = PLANT_THIRST
  freshness = 1
  happiness = HAPPY_START

  readonly crop: CropId
  rarity: Rarity

  constructor(crop: CropId, rarity: Rarity) {
    this.crop = crop
    this.rarity = rarity
  }

  stats(mods: readonly Modifier[]): Stats {
    return statsOf(this.crop, this.rarity, mods)
  }

  get thirsty(): boolean {
    return this.thirst < WITHER
  }

  get critical(): boolean {
    return this.thirst < CRITICAL
  }

  stage(kind: 'growing' | 'ripe' | 'dead'): 'sprout' | 'grow' | 'ripe' | 'dead' {
    if (kind === 'dead') return 'dead'
    if (kind === 'ripe') return 'ripe'
    if (this.maturity < 0.33) return 'sprout'
    return 'grow'
  }
}
