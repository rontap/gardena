import { Container } from 'pixi.js'
import { TRAILER_LEN } from '../../defs/items.ts'
import { hitchP, trailerCenter, wrapHeading } from '../../sim/vehicle.ts'
import type { SeatId, World } from '../../sim/world.ts'
import type { VehicleId } from '../../sim/ids.ts'
import { DROP_FACE, TILE } from '../camera.ts'
import { atlasTex, faceKey, HAT, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'
import { dropRect } from '../hit.ts'

export const QUAD_FOLLOW = 0.35
const WALK_STRIDE = 0.55
const WALK_BOB = 2

type Quad = { x: number; y: number; heading: number; snap: boolean }

export class ActorsLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)
  private readonly quads = new Map<VehicleId, Quad>()
  private readonly walk = new Map<SeatId, { phase: number; x: number; y: number }>()
  private world: World | undefined

  bind(world: World): void {
    if (this.world !== world) {
      this.quads.clear()
      this.walk.clear()
      this.world = world
    }
  }

  private bob(id: SeatId, x: number, y: number): number {
    const w = this.walk.get(id)
    if (w === undefined) {
      this.walk.set(id, { phase: 0, x, y })
      return 0
    }
    const d = Math.hypot(x - w.x, y - w.y)
    w.x = x
    w.y = y
    if (d < 0.0005) {
      w.phase = 0
      return 0
    }
    w.phase = (w.phase + d / WALK_STRIDE) % 1
    return w.phase < 0.25 || w.phase >= 0.75 ? 0 : -WALK_BOB
  }

  pose(id: VehicleId): Quad | undefined {
    return this.quads.get(id)
  }

  snap(): void {
    this.quads.forEach(q => {
      q.snap = true
    })
  }

  tick(world: World): void {
    world.vehicles.forEach(v => {
      if (v.pose.kind !== 'field') {
        this.quads.delete(v.id)
        return
      }
      let q = this.quads.get(v.id)
      if (q === undefined) {
        q = { x: v.pose.x, y: v.pose.y, heading: v.pose.heading, snap: false }
        this.quads.set(v.id, q)
      } else if (q.snap) {
        q.x = v.pose.x
        q.y = v.pose.y
        q.heading = v.pose.heading
        q.snap = false
      } else {
        q.x += (v.pose.x - q.x) * QUAD_FOLLOW
        q.y += (v.pose.y - q.y) * QUAD_FOLLOW
        const turn = wrapHeading(v.pose.heading - q.heading + Math.PI) - Math.PI
        q.heading = wrapHeading(q.heading + turn * QUAD_FOLLOW)
      }
    })
    this.paint(world)
  }

  patch(world: World): void {
    this.paint(world)
  }

  private paint(world: World): void {
    this.pool.begin()
    const pack = new Map<string, number>()
    world.drops.forEach(d => {
      const k = `${d.at.col},${d.at.row}`
      const i = pack.get(k)
      const n = i === undefined ? 0 : i
      pack.set(k, n + 1)
      const r = dropRect(d.at, n)
      const s = this.pool.take(atlasTex(faceKey(d.item)))
      s.position.set(r.x * TILE, r.y * TILE)
      s.scale.set(DROP_FACE / TILE)
    })
    world.vehicles.forEach(v => {
      if (v.pose.kind !== 'field') return
      const q = this.quads.get(v.id)
      const x = q === undefined ? v.pose.x : q.x
      const y = q === undefined ? v.pose.y : q.y
      const heading = q === undefined ? v.pose.heading : q.heading
      if (v.kind === 'tractor' && v.hitch !== 'none') {
        const t = world.trailers.find(tr => tr.id === v.hitch)
        if (t !== undefined && t.pose.kind === 'attached') {
          const p = hitchP(x, y, heading)
          const c = trailerCenter(p, t.pose.heading)
          const body = this.pool.take(atlasTex(`trailer-${t.kind}`))
          body.anchor.set(0.5)
          body.position.set(c.x * TILE, c.y * TILE)
          body.rotation = t.pose.heading
          const rake = this.pool.take(atlasTex('trailer-rake'))
          const sc = v.boom / 5
          const rx = c.x - (TRAILER_LEN / 2) * Math.cos(t.pose.heading)
          const ry = c.y - (TRAILER_LEN / 2) * Math.sin(t.pose.heading)
          rake.anchor.set(0, 0.5)
          rake.position.set(rx * TILE, ry * TILE)
          rake.rotation = t.pose.heading + Math.PI / 2
          rake.scale.set(sc, 1)
        }
      }
      const veh = this.pool.take(atlasTex(v.kind === 'tractor' ? 'tractor' : 'quad'))
      veh.anchor.set(0.5)
      veh.position.set(x * TILE, y * TILE)
      veh.rotation = heading
      if (v.pose.driver !== 'none') {
        const hat = this.pool.take(atlasTex('actor-hat'))
        hat.anchor.set(0.5)
        hat.position.set(x * TILE, y * TILE)
        hat.rotation = heading
        hat.tint = HAT[v.pose.driver]
      }
    })
    world.seats.forEach(s => {
      const seated = world.driverVehicle(s.id) !== undefined
      if (s.presence !== 'in' || seated) return
      this.actor(s.id, s.actor.x, s.actor.y, s.napping, s.hand.kind === 'hold' ? faceKey(s.hand.item) : undefined)
    })
    this.pool.end()
  }

  private actor(id: SeatId, x: number, y: number, napping: boolean, item: AtlasKey | undefined): void {
    const ox = (x - 0.5) * TILE
    const oy = (y - 0.5) * TILE + (napping ? 0 : this.bob(id, x, y))
    const body = this.pool.take(atlasTex('actor-body'))
    body.position.set(ox, oy)
    body.alpha = 1
    if (napping) {
      body.anchor.set(0.5)
      body.position.set(ox + TILE / 2, oy + TILE / 2)
      body.rotation = Math.PI / 2
    }
    const hat = this.pool.take(atlasTex('actor-hat'))
    hat.tint = HAT[id]
    hat.alpha = 1
    if (napping) {
      hat.anchor.set(0.5)
      hat.position.set(ox + TILE / 2, oy + TILE / 2)
      hat.rotation = Math.PI / 2
    } else {
      hat.position.set(ox, oy)
    }
    if (!napping && item !== undefined) {
      const held = this.pool.take(atlasTex(item))
      held.position.set(ox + (15 * TILE) / 24, oy + (13 * TILE) / 24)
      held.scale.set(8 / 24)
    }
  }
}
