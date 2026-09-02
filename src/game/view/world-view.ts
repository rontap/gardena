import { Container } from 'pixi.js'
import { FADE } from '../sim/building.ts'
import type { Place, World } from '../sim/world.ts'
import type { Edge } from '../sim/pipe.ts'
import { vertsOf } from '../sim/pipe.ts'
import { TILE, clampCam, type Camera } from './camera.ts'
import { createApp, destroyApp } from './app.ts'
import { atlasReady } from './atlas.ts'
import { clickHit, hoverSprinkler, type Lens } from './hit.ts'
import { GroundLayer } from './layers/ground.ts'
import { PlotsLayer } from './layers/plots.ts'
import { PipesLayer } from './layers/pipes.ts'
import { PropsLayer } from './layers/props.ts'
import { ActorsLayer } from './layers/actors.ts'
import { OverlayLayer } from './layers/overlay.ts'
import { VfxLayer, type VfxMount } from './layers/vfx.ts'
import type { DirtyReason } from '../sim/world.ts'

export type ViewHooks = {
  cam: Camera
  pendingPipe: Edge[]
  hit: (wx: number, wy: number) => ReturnType<typeof clickHit>
  vfxN: number
}

export class WorldView {
  readonly farm = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly ground = new GroundLayer()
  private readonly plots = new PlotsLayer()
  private readonly pipes = new PipesLayer()
  private readonly props = new PropsLayer()
  private readonly actors = new ActorsLayer()
  private readonly overlay = new OverlayLayer()
  private readonly vfx = new VfxLayer()
  private app: Awaited<ReturnType<typeof createApp>>
  private world: World
  cam: Camera
  lens: Lens
  editor: boolean
  pendingPipe: Edge[] = []
  private hideVerts: { col: number; row: number }[] = []
  private hoverAoe: ReturnType<typeof hoverSprinkler>
  private ptr: { x: number; y: number } | undefined
  private groundRev = -1
  private ownedN = -1
  private unsub: (() => void) | undefined
  private onCam: (c: Camera) => void
  onVfx: ((m: VfxMount[]) => void) | undefined
  onSpeech: (() => void) | undefined
  onPipeLoc: (() => void) | undefined
  htmlLayer: HTMLElement | undefined
  private vfxSig = ''

  private constructor(
    app: Awaited<ReturnType<typeof createApp>>,
    world: World,
    cam: Camera,
    lens: Lens,
    editor: boolean,
    onCam: (c: Camera) => void,
  ) {
    this.app = app
    this.world = world
    this.cam = cam
    this.lens = lens
    this.editor = editor
    this.onCam = onCam
    this.farm.eventMode = 'none'
    this.farm.addChild(
      this.ground.root,
      this.plots.root,
      this.vfx.ground,
      this.pipes.root,
      this.props.root,
      this.actors.root,
      this.overlay.root,
      this.vfx.root,
    )
    this.app.stage.addChild(this.farm)
    this.actors.bind(world)
    this.vfx.bind(world)
    this.patch('all')
    this.unsub = world.on((kind, reasons) => {
      if (kind !== 'dirty') return
      if (reasons.has('speech')) this.onSpeech?.()
      if (reasons.has('field') || reasons.has('big') || reasons.has('act')) this.patch('field')
    })
    this.app.ticker.add(() => this.tick())
  }

  static async mount(
    host: HTMLElement,
    world: World,
    cam: Camera,
    lens: Lens,
    editor: boolean,
    onCam: (c: Camera) => void,
  ): Promise<WorldView> {
    await atlasReady()
    const app = await createApp(host)
    return new WorldView(app, world, cam, lens, editor, onCam)
  }

  setCam(cam: Camera): void {
    this.cam = cam
  }

  setLens(lens: Lens, editor: boolean): void {
    this.lens = lens
    this.editor = editor
    this.patch('field')
  }

  setPending(edges: Edge[]): void {
    this.pendingPipe = edges
    this.hideVerts = edges.flatMap(e => vertsOf(e))
    this.patch('pipes')
  }

  setHover(wx: number, wy: number, place: Place): void {
    this.ptr = { x: wx, y: wy }
    this.hoverAoe = place.kind === 'none' ? hoverSprinkler(this.world, wx, wy) : undefined
    this.patch('overlay')
  }

  hit(wx: number, wy: number): ReturnType<typeof clickHit> {
    return clickHit(this.world, wx, wy, this.lens)
  }

  vfxMounts(): VfxMount[] {
    return this.vfx.mounts
  }

  get vfxN(): number {
    return this.vfx.vfxN
  }

  destroy(): void {
    if (this.unsub !== undefined) this.unsub()
    destroyApp(this.app)
  }

  private tick(): void {
    const world = this.world
    this.actors.tick(world)
    this.vfx.tick(world, performance.now())
    this.overlay.flowTick(world, performance.now())
    const driven = world.driverVehicle(world.local)
    if (driven !== undefined && driven.pose.kind === 'field') {
      const q = this.actors.pose(driven.id)
      const x = q === undefined ? driven.pose.x : q.x
      const y = q === undefined ? driven.pose.y : q.y
      const next = clampCam(
        { x, y, scale: this.cam.scale },
        (() => {
          const b = world.bounds()
          return { col0: b.col0 - FADE, row0: b.row0 - FADE, col1: b.col1 + FADE, row1: b.row1 + FADE }
        })(),
      )
      if (next.x !== this.cam.x || next.y !== this.cam.y) {
        this.cam = next
        this.onCam(next)
      }
    }
    this.layout()
    this.onSpeech?.()
    const sig = mountSig(this.vfx.mounts)
    if (sig !== this.vfxSig) {
      this.vfxSig = sig
      this.onVfx?.(this.vfx.mounts)
    }
  }

  private patch(kind: 'all' | 'field' | 'pipes' | 'overlay'): void {
    const world = this.world
    const place = world.seats[world.local].place
    if (kind === 'all') {
      this.ground.rebuild(world)
      this.groundRev = world.groundRev
      this.ownedN = world.owned.length
      this.actors.snap()
    }
    if (kind === 'all' || kind === 'field') {
      if (world.groundRev !== this.groundRev || world.owned.length !== this.ownedN) {
        this.ground.rebuild(world)
        this.groundRev = world.groundRev
        this.ownedN = world.owned.length
      }
      this.plots.patch(world)
      this.props.patch(world)
      this.pipes.patch(world, this.lens, place, this.hideVerts)
      this.overlay.patch(world, this.lens, this.editor, place, this.hoverAoe, this.ptr)
      this.actors.patch(world)
      this.onPipeLoc?.()
    }
    if (kind === 'pipes') {
      this.pipes.patch(world, this.lens, place, this.hideVerts)
    }
    if (kind === 'overlay') {
      this.overlay.patch(world, this.lens, this.editor, place, this.hoverAoe, this.ptr)
    }
  }

  layout(): void {
    const w = this.app.renderer.screen.width
    const h = this.app.renderer.screen.height
    this.farm.position.set(w / 2, h / 2)
    this.farm.scale.set(this.cam.scale)
    this.farm.pivot.set(this.cam.x * TILE, this.cam.y * TILE)
    if (this.htmlLayer !== undefined) {
      this.htmlLayer.style.transform = `translate(${w / 2}px, ${h / 2}px) scale(${this.cam.scale}) translate(${-this.cam.x * TILE}px, ${-this.cam.y * TILE}px)`
    }
  }
}

function mountSig(ms: VfxMount[]): string {
  return ms.map(m => `${m.id}:${m.seq ?? ''}:${m.col},${m.row}`).join('|')
}

export type { DirtyReason }
