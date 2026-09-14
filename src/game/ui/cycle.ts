import { useEffect, useState } from 'react'

export const CYCLE_MS = 800

export const REFRESH_MS = 500

/** Repaints a panel that reads numbers the tick moves on its own, with no player act to ping on. */
export function useRefresh(): void {
  const [, set] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => set(n => n + 1), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [])
}

export function useCycle(n: number): number {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (n < 2) return
    const t = window.setInterval(() => setStage(s => (s + 1) % n), CYCLE_MS)
    return () => window.clearInterval(t)
  }, [n])
  return stage % n
}
