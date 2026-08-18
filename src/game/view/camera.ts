export type Camera = { x: number; y: number; scale: number }

export const TILE = 48

export function tileVariant(col: number, row: number, n: number): number {
  return ((Math.imul(col, 374761393) + Math.imul(row, 668265263)) >>> 0) % n
}

export function clampCam(c: Camera): Camera {
  const scale = Math.min(3, Math.max(0.5, c.scale))
  return { x: c.x, y: c.y, scale }
}
