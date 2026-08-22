export type SourceKind = 'pump' | 'well' | 'rain-tank'

export const SOURCE: { readonly [K in SourceKind]: { rate: number; capacity: number; start: number } } = {
  pump: { rate: 2.5, capacity: 50, start: 50 },
  well: { rate: 5, capacity: 150, start: 150 },
  'rain-tank': { rate: 0.4, capacity: 100, start: 0 },
}

export const TAP_RATE = 5

export class Reservoir {
  readonly kind: SourceKind
  stored: number
  drawn = 0

  constructor(kind: SourceKind) {
    this.kind = kind
    this.stored = SOURCE[kind].start
  }

  get rate(): number {
    return SOURCE[this.kind].rate
  }

  get capacity(): number {
    return SOURCE[this.kind].capacity
  }

  gather(dt: number): void {
    const next = this.stored + this.rate * dt
    this.stored = next > this.capacity ? this.capacity : next
  }

  take(liters: number): number {
    const got = liters > this.stored ? this.stored : liters
    this.stored -= got
    this.drawn += got
    return got
  }
}

export function pull(sources: readonly Reservoir[], want: number): number {
  const held = sources.reduce((a, s) => a + s.stored, 0)
  if (held === 0) return 0
  const take = want > held ? held : want
  return sources.reduce((got, s) => got + s.take((s.stored / held) * take), 0)
}
