import { Application, Container, CullerPlugin, Sprite, Texture, extensions } from 'pixi.js'

let culler = false

export async function createApp(host: HTMLElement): Promise<Application> {
  if (!culler) {
    extensions.add(CullerPlugin)
    culler = true
  }
  const app = new Application()
  await app.init({
    resizeTo: host,
    antialias: false,
    roundPixels: true,
    preference: 'webgl',
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio),
    background: 0x4a7c3f,
  })
  app.canvas.style.display = 'block'
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  host.appendChild(app.canvas)
  app.stage.eventMode = 'none'
  app.stage.interactiveChildren = false
  return app
}

export function destroyApp(app: Application): void {
  app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true })
}

export class SpritePool {
  private readonly items: Sprite[] = []
  private n = 0
  private readonly parent: Container
  constructor(parent: Container) {
    this.parent = parent
  }
  begin(): void {
    this.n = 0
  }
  take(texture: Texture): Sprite {
    let s = this.items[this.n]
    if (s === undefined) {
      s = new Sprite({ texture, eventMode: 'none', roundPixels: true })
      this.parent.addChild(s)
      this.items.push(s)
    } else {
      s.texture = texture
      s.visible = true
    }
    s.alpha = 1
    s.tint = 0xffffff
    s.rotation = 0
    s.anchor.set(0)
    s.scale.set(1)
    s.position.set(0, 0)
    this.n += 1
    return s
  }
  end(): void {
    for (let i = this.n; i < this.items.length; i++) this.items[i].visible = false
  }
}
