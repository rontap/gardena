export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function never(x: never): never {
  throw new Error(JSON.stringify(x))
}
