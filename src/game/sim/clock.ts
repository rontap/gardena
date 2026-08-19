export const DAY_SECONDS = 240

export type DayPhase = 'sunrise' | 'day' | 'sunset' | 'twilight'

export function days(s: number): number {
  return s / DAY_SECONDS
}

export class Clock {
  day = 1
  t = 0
  banner = 2

  get remaining(): number {
    return DAY_SECONDS - this.t
  }

  phase(): DayPhase {
    const p = this.t / DAY_SECONDS
    if (p < 0.25) return 'sunrise'
    if (p < 0.65) return 'day'
    if (p < 0.9) return 'sunset'
    return 'twilight'
  }

  advance(dt: number): 'tick' | 'seam' {
    if (this.t + dt >= DAY_SECONDS) {
      this.day += 1
      this.t = 0
      this.banner = 0
      return 'seam'
    }
    this.t += dt
    if (this.banner > 0) this.banner = Math.max(0, this.banner - dt)
    return 'tick'
  }
}
