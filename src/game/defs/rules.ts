import type { Stars } from '../sim/feature-contracts/market.h.ts'
import { PLANT_FERT_PER_SEC } from '../sim/soil.ts'

export type Difficulty = 'peaceful' | 'normal' | 'hard'

export type Speed = 'leisurely' | 'normal' | 'fast'

export type Rules = {
  difficulty: Difficulty
  speed: Speed
}

export const RULES_NORMAL: Rules = { difficulty: 'normal', speed: 'normal' }

export type Hardness = {
  plantFertPerSec: number
  freshFull: number
  rotMul: number
  happy: { wilt: number; drown: number; starve: number; gain: number }
  penaltyRate: number
  repLost: { readonly [K in Stars]: number }
  cancelMin: number
  repIdle: number
  stipend: readonly { through: number; amount: number }[]
  loanPayback: boolean
  weedChance: number
  weedNeighbour: number
  weedPulled: number
  weedStart: number
}

export const HARDNESS: { readonly [K in Difficulty]: Hardness } = {
  peaceful: {
    plantFertPerSec: 0.0008,
    freshFull: 0.7,
    rotMul: 1.1,
    happy: { wilt: 260, drown: 200, starve: 380, gain: 840 },
    penaltyRate: 0.1,
    repLost: { 1: 0.5, 2: 1, 3: 1.5, 4: 2 },
    cancelMin: 0.05,
    repIdle: 0.2,
    stipend: [
      { through: 3, amount: 16 },
      { through: 6, amount: 8 },
      { through: 10, amount: 4 },
    ],
    loanPayback: false,
    weedChance: 0.025,
    weedNeighbour: 0.03,
    weedPulled: -0.09,
    weedStart: -0.15,
  },
  normal: {
    plantFertPerSec: PLANT_FERT_PER_SEC,
    freshFull: 0.75,
    rotMul: 1,
    happy: { wilt: 240, drown: 180, starve: 340, gain: 900 },
    penaltyRate: 0.2,
    repLost: { 1: 1, 2: 2, 3: 3, 4: 4 },
    cancelMin: 0.1,
    repIdle: 0.4,
    stipend: [
      { through: 3, amount: 12 },
      { through: 6, amount: 6 },
      { through: 10, amount: 3 },
    ],
    loanPayback: true,
    weedChance: 0.0275,
    weedNeighbour: 0.04,
    weedPulled: -0.06,
    weedStart: -0.1,
  },
  hard: {
    plantFertPerSec: 0.0009,
    freshFull: 0.8,
    rotMul: 0.9,
    happy: { wilt: 220, drown: 160, starve: 300, gain: 960 },
    penaltyRate: 0.4,
    repLost: { 1: 2, 2: 3, 3: 4, 4: 5 },
    cancelMin: 0.2,
    repIdle: 0.8,
    stipend: [
      { through: 3, amount: 10 },
      { through: 6, amount: 5 },
      { through: 10, amount: 2 },
    ],
    loanPayback: true,
    weedChance: 0.03,
    weedNeighbour: 0.05,
    weedPulled: -0.03,
    weedStart: -0.05,
  },
}

export const GAME_SPEED: { readonly [K in Speed]: number } = {
  leisurely: 0.75,
  normal: 1,
  fast: 1.5,
}
