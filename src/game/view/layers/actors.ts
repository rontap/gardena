import { Container } from 'pixi.js'
import { TRAILER_LEN } from '../../defs/items.ts'
import { hitchP, trailerCenter, wrapHeading } from '../../sim/vehicle.ts'
import type { SeatId, World } from '../../sim/world.ts'
import type { VehicleId } from '../../sim/ids.ts'
import { TILE } from '../camera.ts'
import { atlasTex, faceKey, HAT, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'

export const QUAD_FOLLOW = 0.35

type Quad = { x: number; y: number; heading: number; snap: boolean }

export class ActorsLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)
  private readonly quads = new Map<VehicleId, Quad>()
  private world: World | undefined

  bind(world: World): void {
    if (this.world !== world) {
      this.quads.clear()
      this.world = world
    }
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
    world.drops.forEach((d, i) => {
      const n = i % 4
      const s = this.pool.take(atlasTex(faceKey(d.item)))
      s.position.set(d.at.col * TILE + 4 + (n % 2) * 6, d.at.row * TILE + 4 + Math.floor(n / 2) * 6)
      s.scale.set(33 / 24)
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
    const oy = (y - 0.5) * TILE
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
