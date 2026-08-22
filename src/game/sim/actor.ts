import type { Coord } from './building.ts'

export const WALK = 6

export class Actor {
  x: number
  y: number
  work = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  get cell(): Coord {
    return { col: Math.floor(this.x), row: Math.floor(this.y) }
  }

  inside(at: Coord): boolean {
    return this.x >= at.col && this.x < at.col + 1 && this.y >= at.row && this.y < at.row + 1
  }

  walkToward(at: Coord, dt: number, speed: number): void {
    const tx = at.col + 0.5
    const ty = at.row + 0.5
    const dx = tx - this.x
    const dy = ty - this.y
    const dist = Math.hypot(dx, dy)
    const step = speed * dt
    if (dist <= step) {
      this.x = tx
      this.y = ty
      return
    }
    this.x += (dx / dist) * step
    this.y += (dy / dist) * step
  }
}
