import { LOAN_BELOW, LOAN_CASH, LOAN_DAYS, LOAN_PACK, LOAN_PACKS, LOAN_PAYBACK } from '../defs/loan.ts'
import { skuItem } from './item.ts'
import { boughtSeedQuality } from './store.ts'
import type { World } from './world.ts'

export function settleLoan(world: World): { loan: number; payback: number } {
  const payback = world.loanDays > 0 ? LOAN_PAYBACK : 0
  if (payback > 0) {
    world.money -= payback
    world.loanDays -= 1
  }
  if (world.money >= LOAN_BELOW || world.silo.used > 0) return { loan: 0, payback }
  const pack = skuItem(LOAN_PACK)
  if (pack.kind !== 'seeds') throw new Error('pack')
  world.silo.put(pack.crop, pack.variety, boughtSeedQuality(world, pack.crop), LOAN_PACKS * pack.count)
  world.money += LOAN_CASH
  if (world.hard.loanPayback) world.loanDays += LOAN_DAYS
  return { loan: LOAN_CASH, payback }
}
