export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function never(x: never): never {
  throw new Error(JSON.stringify(x))
}

export function originOrder(a: { row: number; col: number }, b: { row: number; col: number }): number {
  return a.row === b.row ? a.col - b.col : a.row - b.row
}
