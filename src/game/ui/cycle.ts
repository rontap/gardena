import { useEffect, useState } from 'react'

export const CYCLE_MS = 800

export function useCycle(n: number): number {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (n < 2) return
    const t = window.setInterval(() => setStage(s => (s + 1) % n), CYCLE_MS)
    return () => window.clearInterval(t)
  }, [n])
  return stage % n
}
