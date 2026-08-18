export type Camera = { x: number; y: number; scale: number }

export const TILE = 48

export function tileVariant(col: number, row: number, n: number): number {
  return ((Math.imul(col, 374761393) + Math.imul(row, 668265263)) >>> 0) % n
}

export function clampCam(
  c: Camera,
  b: { col0: number; row0: number; col1: number; row1: number },
): Camera {
  const scale = Math.min(3, Math.max(0.5, c.scale))
  return {
    x: Math.min(b.col1, Math.max(b.col0, c.x)),
    y: Math.min(b.row1, Math.max(b.row0, c.y)),
    scale,
  }
}
