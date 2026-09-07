export function visualRound(n: number): number {
  return Math.round(n * 2) / 2
}

declare global {
  interface Math {
    visualRound(n: number): number
  }
}

Math.visualRound = visualRound
