export const DAY_SECONDS = 240

export class Clock {
  day = 1
  t = 0
  banner = 2

  get remaining(): number {
    return DAY_SECONDS - this.t
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
