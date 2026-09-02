import { Container } from 'pixi.js'
import { occupiedCells } from '../../sim/building.ts'
import { edgeKey, type Edge } from '../../sim/pipe.ts'
import type { CropId } from '../../sim/ids.ts'
import type { World } from '../../sim/world.ts'
import { TILE } from '../camera.ts'
import { atlasTex, fenceFit, pipeFit, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'
import { PIPE_PLACE, arms } from '../hit.ts'
import type { Lens } from '../hit.ts'
import type { Place } from '../../sim/world.ts'

export class PipesLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)

  patch(world: World, lens: Lens, place: Place, hide: readonly { col: number; row: number }[]): void {
    const hideSet = new Set(hide.map(v => `${v.col},${v.row}`))
    const faint =
      lens !== 'pipes' &&
      place.kind !== 'delete' &&
      !(place.kind === 'sku' && PIPE_PLACE.includes(place.id))
    const alpha = faint ? 0.35 : 1
    this.pool.begin()
    world.fences.forEach(k => {
      const comma = k.indexOf(',')
      const col = Number(k.slice(0, comma))
      const row = Number(k.slice(comma + 1))
      const a = world.fenceArms({ col, row })
      const fit = fenceFit(a.n, a.e, a.s, a.w)
      const s = this.pool.take(atlasTex(fit.key))
      s.anchor.set(0.5)
      s.position.set(col * TILE + TILE / 2, row * TILE + TILE / 2)
      s.rotation = (fit.rot * Math.PI) / 180
      s.alpha = alpha
    })
    world.pumps.forEach(p => {
      occupiedCells(p.base, world.owned).forEach(at => {
        const s = this.pool.take(atlasTex('pipe-source'))
        s.position.set(at.col * TILE, at.row * TILE)
        s.alpha = alpha
      })
    })
    world.tanks.forEach(t => {
      occupiedCells(t.base, world.owned).forEach(at => {
        const s = this.pool.take(atlasTex('pipe-source'))
        s.position.set(at.col * TILE, at.row * TILE)
        s.alpha = alpha
      })
    })
    world.wells.forEach(w => {
      this.mid(w.at, 'well', alpha)
    })
    world.segments.forEach(seg => {
      if (seg.gate.kind === 'valve') this.mid(seg.at, seg.gate.open ? 'valve-open' : 'valve-closed', alpha)
      if (seg.gate.kind === 'smart') {
        const h = world.smartHold.get(edgeKey(seg.at))
        this.mid(seg.at, h !== undefined && h.level === 1 ? 'smart-open' : 'smart-closed', alpha)
      }
    })
    world.eachNetVert(v => {
      if (hideSet.has(`${v.col},${v.row}`)) return
      const a = arms(world, v, [])
      const fit = pipeFit(a.n, a.e, a.s, a.w)
      if (fit === undefined) return
      const wet = world.vertexWet(v)
      const s = this.pool.take(atlasTex(wet ? fit.key : `${fit.key}-dry`))
      s.anchor.set(0.5)
      s.position.set(v.col * TILE, v.row * TILE)
      s.rotation = (fit.rot * Math.PI) / 180
      s.alpha = alpha
    })
    world.sprinklers.forEach(sp => {
      const key = sp.variant === 'basic' ? 'sprinkler' : sp.variant === 'large' ? 'sprinkler-large' : 'sprinkler-vert'
      const rot = sp.variant === 'vert' && sp.facing === 'ns' ? 90 : 0
      const s = this.pool.take(atlasTex(key))
      s.anchor.set(0.5)
      s.position.set(sp.at.col * TILE, sp.at.row * TILE)
      s.rotation = (rot * Math.PI) / 180
      s.alpha = alpha
      if (sp.tune.kind === 'crop') {
        const c = this.pool.take(atlasTex(cropTune(sp.tune.crop)))
        c.position.set(sp.at.col * TILE - TILE * 0.22, sp.at.row * TILE - TILE * 0.62)
        c.scale.set(0.44)
        c.alpha = alpha
      }
    })
    this.pool.end()
  }

  private mid(e: Edge, key: AtlasKey, alpha: number): void {
    const x = e.axis === 'h' ? (e.col + 0.5) * TILE : e.col * TILE
    const y = e.axis === 'h' ? e.row * TILE : (e.row + 0.5) * TILE
    const rot = e.axis === 'h' ? 0 : 90
    const s = this.pool.take(atlasTex(key))
    s.anchor.set(0.5)
    s.position.set(x, y)
    s.rotation = (rot * Math.PI) / 180
    s.alpha = alpha
  }
}

function cropTune(crop: CropId): AtlasKey {
  return `crop-${crop}:ripe`
}
