export type Camera = { x: number; y: number; scale: number }

export const TILE = 32

export function clampCam(c: Camera): Camera {
  const scale = Math.min(3, Math.max(0.5, c.scale))
  return { x: c.x, y: c.y, scale }
}
